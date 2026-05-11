import { useEffect, useMemo, useState } from "react";
import SidebarLayout from "../layouts/SidebarLayout";
import { supabase } from "../supabaseClient";
import {
  getServiceRequests,
  createServiceRequest,
  updateServiceRequestStatus,
} from "../serviceRequests";
import { getBuildings } from "../buildings";
import { getFloorsByBuilding } from "../floors";
import { getRoomsByFloor } from "../rooms";

export default function ServiceRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [buildings, setBuildings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    building_id: "",
    floor_id: "",
    room_id: "",
  });

  useEffect(() => {
    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (data) setRole(data.role);
    }

    async function loadBuildings() {
      try {
        const data = await getBuildings();
        setBuildings(data || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load buildings");
      }
    }

    loadRole();
    loadRequests();
    loadBuildings();
  }, []);

  async function loadRequests() {
    try {
      setLoadingRequests(true);
      const data = await getServiceRequests();
      setRequests(data || []);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to load service requests");
    } finally {
      setLoadingRequests(false);
    }
  }

  function isAdmin() {
    return role === "admin";
  }

  function isChief() {
    return role === "chief";
  }
  <option value="">All</option>
  function isStaff() {
    return role === "staff";
  }

  function canManageStatus() {
    return isAdmin() || isChief();
  }

  function getStatusBadgeClass(status: string) {
    if (status === "resolved") return "bg-green-100 text-green-800";
    if (status === "cancelled") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  }
  
  function formatStatus(status: string) {
    if (status === "pending") return "Pending";
    if (status === "cancelled") return "Cancelled";
    if (status === "resolved") return "Resolved";
    return status;
  }

  async function handleChange(e: any) {
    const { name, value } = e.target;

    if (name === "building_id") {
      if (!value) {
        setFloors([]);
        setRooms([]);
        setForm((prev) => ({
          ...prev,
          building_id: "",
          floor_id: "",
          room_id: "",
        }));
        return;
      }

      const floorData = await getFloorsByBuilding(Number(value));
      setFloors(floorData || []);
      setRooms([]);

      setForm((prev) => ({
        ...prev,
        building_id: value,
        floor_id: "",
        room_id: "",
      }));
      return;
    }

    if (name === "floor_id") {
      if (!value) {
        setRooms([]);
        setForm((prev) => ({
          ...prev,
          floor_id: "",
          room_id: "",
        }));
        return;
      }

      const roomData = await getRoomsByFloor(Number(value));
      setRooms(roomData || []);

      setForm((prev) => ({
        ...prev,
        floor_id: value,
        room_id: "",
      }));
      return;
    }

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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in");
        return;
      }

      await createServiceRequest({
        title: form.title.trim(),
        description: form.description.trim(),
        submitted_by: user.id,
        building_id: form.building_id ? Number(form.building_id) : null,
        floor_id: form.floor_id ? Number(form.floor_id) : null,
        room_id: form.room_id ? Number(form.room_id) : null,
      });

      setForm({
        title: "",
        description: "",
        building_id: "",
        floor_id: "",
        room_id: "",
      });

      setFloors([]);
      setRooms([]);

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

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("");
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesStatus = statusFilter ? r.status === statusFilter : true;

      const matchesSearch =
        search.trim() === ""
          ? true
          : r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.description.toLowerCase().includes(search.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, search]);

  return (
    <SidebarLayout background="white">
      <div className="bg-white min-h-screen p-6">
        <h1 className="text-2xl font-bold mb-2">Service Requests</h1>
        <p className="text-sm text-gray-500 mb-6">
          Submit, review, and manage facility-related requests.
        </p>

        {isStaff() && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 mb-8 border rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold">Submit Request</h2>

            <div>
              <label className="block mb-1 font-medium">Building</label>
              <select
                name="building_id"
                value={form.building_id}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              >
                <option value="">Select Building (optional)</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.building_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Floor</label>
              <select
                name="floor_id"
                value={form.floor_id}
                onChange={handleChange}
                disabled={!form.building_id}
                className={`border p-2 rounded w-full ${
                  !form.building_id ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Select Floor (optional)</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    Floor {f.floor_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Room</label>
              <select
                name="room_id"
                value={form.room_id}
                onChange={handleChange}
                disabled={!form.floor_id}
                className={`border p-2 rounded w-full ${
                  !form.floor_id ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Select Room (optional)</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number}
                  </option>
                ))}
              </select>
            </div>

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
                rows={4}
                className="border p-2 rounded w-full"
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

        <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Search Requests</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or description"
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 border rounded cursor-pointer"
            >
              Clear Filters
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Showing {filteredRequests.length} request(s)
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Submitted Requests</h2>

          {loadingRequests ? (
            <p className="text-gray-500">Loading service requests...</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-gray-500">No service requests found.</p>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((r) => (
                <div
                  key={r.id}
                  className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold">{r.title}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded ${getStatusBadgeClass(
                            r.status
                          )}`}
                        >
                          {formatStatus(r.status)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600">
                        Building: {r.buildings?.building_name || "Not specified"}
                      </p>

                      <p className="text-sm text-gray-600">
                        Floor:{" "}
                        {r.floors?.floor_number
                          ? `Floor ${r.floors.floor_number}`
                          : "Not specified"}
                      </p>

                      <p className="text-sm text-gray-600">
                        Room:{" "}
                        {r.rooms?.room_number
                          ? `Room ${r.rooms.room_number}`
                          : "Not specified"}
                      </p>

                      <p className="text-sm text-gray-600">
                        Submitted by ID: {r.submitted_by || "Unknown"}
                      </p>

                      <p className="text-xs text-gray-400 mt-2 mb-2">
                        {new Date(r.created_at).toLocaleString()}
                      </p>

                      <p className="text-sm">{r.description}</p>
                    </div>

                    {canManageStatus() && (
                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        className="border p-2 rounded cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="resolved">Resolved</option>
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