import { useEffect, useState } from "react";
import SidebarLayout from "../layouts/SidebarLayout";
import { supabase } from "../supabaseClient";
import {
  getServiceRequests,
  createServiceRequest,
  updateServiceRequestStatus,
} from "../serviceRequests";

export default function ServiceRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    async function loadRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (data) setRole(data.role);
    }

    loadRole();
    loadRequests();
  }, []);

  async function loadRequests() {
    const data = await getServiceRequests();
    setRequests(data || []);
  }

  function isStaff() {
    return role === "staff";
    }

  function isAdmin() {
    return role === "admin";
  }

  function isChief() {
    return role === "chief";
  }

  function canManageStatus() {
    return isAdmin() || isChief();
  }

  function handleChange(e: any) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (submitting) return;

    if (!form.title.trim()) {
      alert("Title is required");
      return;
    }

    if (!form.description.trim()) {
      alert("Description is required");
      return;
    }

    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be logged in");
        return;
      }

      await createServiceRequest({
        title: form.title.trim(),
        description: form.description.trim(),
        submitted_by: user.id,
      });

      setForm({
        title: "",
        description: "",
      });

      await loadRequests();
      alert("Service request submitted");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: number, status: string) {
    try {
      await updateServiceRequestStatus(id, status);
      await loadRequests();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update status");
    }
  }

  return (
    <SidebarLayout background="white">
      <div className="bg-white min-h-screen p-6">
        <h1 className="text-2xl font-bold mb-4">Service Requests</h1>

        {isStaff() && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                <div>
                <label className="block mb-1 font-medium">
                    Title <span className="text-red-500">*</span>
                </label>
                <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    className="border p-2 rounded w-full"
                />
                </div>

                <div>
                <label className="block mb-1 font-medium">
                    Description <span className="text-red-500">*</span>
                </label>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                    className="border p-2 rounded w-full"
                    rows={4}
                />
                </div>

                <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 bg-black text-white rounded ${
                    submitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                >
                {submitting ? "Submitting..." : "Submit Request"}
                </button>
            </form>
        )}

        {!isStaff() && (
            <p className="text-sm text-gray-500 mb-6">
                You can review and manage service requests, but only staff can submit new ones.
            </p>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-3">Submitted Requests</h2>

          {requests.length === 0 ? (
            <p className="text-gray-500">No service requests yet.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => (
                <div key={r.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                        <h3 className="text-lg font-bold">{r.title}</h3>

                        <p className="text-sm text-gray-600">
                        Submitted by: {r.profiles?.full_name || r.submitted_by || "Unknown"}
                        </p>

                        <p className="text-sm text-gray-600 mb-2">
                        Status: {r.status}
                        </p>

                        <p>{r.description}</p>
                    </div>

                    {canManageStatus() && (
                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        className="border p-2 rounded"
                      >
                        <option value="pending">pending</option>
                        <option value="in progress">in progress</option>
                        <option value="resolved">resolved</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}