import { useEffect, useState } from "react";
import SidebarLayout from "../layouts/SidebarLayout";
import {
  getColleges,
  createCollege,
  updateCollege,
  deleteCollege,
} from "../colleges";
import { getCurrentUserRole } from "../auth";

export default function AdminColleges() {
  const [role, setRole] = useState<string | null>(null);
  const [colleges, setColleges] = useState<any[]>([]);
  const [newCollege, setNewCollege] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      try {
        const r = await getCurrentUserRole();
        setRole(r);

        if (r === "admin") {
          const data = await getColleges();
          setColleges(data || []);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load colleges");
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  async function load() {
    const data = await getColleges();
    setColleges(data || []);
  }

  async function handleCreate() {
    const name = newCollege.trim();

    if (!name) {
      alert("College name cannot be empty");
      return;
    }

    try {
      await createCollege(name);
      setNewCollege("");
      await load();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to add college");
    }
  }

  async function handleUpdate(id: number, currentName: string) {
    const name = prompt("New college name:", currentName);

    if (!name?.trim()) return;

    try {
      await updateCollege(id, name.trim());
      await load();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update college");
    }
  }

  async function handleDelete(id: number) {
    const confirmDelete = window.confirm("Delete this college?");
    if (!confirmDelete) return;

    try {
      await deleteCollege(id);
      await load();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete college");
    }
  }

  return (
    <SidebarLayout background="white">
      <div className="min-h-screen bg-white p-6">
        {loading ? (
          <p>Loading colleges...</p>
        ) : role !== "admin" ? (
          <p className="text-[#8d1b39]">Access denied. Admins only.</p>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-[#8d1b39]/20 bg-white/75 p-6 shadow-md backdrop-blur-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-black/60">Admin</p>
                  <h1 className="text-3xl font-bold text-[#f9b837]">
                    Manage Colleges
                  </h1>
                  <p className="mt-1 text-sm text-black/60">
                    Add, update, or remove colleges used in the building inventory.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#8d1b39]/20 bg-white/70 px-6 py-4 text-center shadow-sm">
                  <div className="text-sm text-black/60">Total Colleges</div>
                  <div className="text-3xl font-bold">{colleges.length}</div>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-[#8d1b39]/20 bg-white/70 p-4 shadow-sm backdrop-blur-md">
              <h2 className="mb-3 text-lg font-semibold">Add College</h2>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  placeholder="New college name"
                  value={newCollege}
                  onChange={(e) => setNewCollege(e.target.value)}
                  className="w-full rounded-lg border border-[#8d1b39]/30 bg-white/80 p-3"
                />

                <button
                  type="button"
                  onClick={handleCreate}
                  className="rounded-lg bg-[#8d1b39] px-5 py-3 text-white transition hover:scale-[1.02]"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#8d1b39]/20 bg-white/70 shadow-sm backdrop-blur-md">
              <table className="min-w-full text-sm">
                <thead className="bg-[#8d1b39] text-white">
                  <tr>
                    <th className="p-3 text-left">College Name</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {colleges.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-4 text-black/60">
                        No colleges found.
                      </td>
                    </tr>
                  ) : (
                    colleges.map((college) => (
                      <tr
                        key={college.id}
                        className="border-t border-[#8d1b39]/10 hover:bg-[#8d1b39]/5"
                      >
                        <td className="p-3 font-medium">{college.name}</td>

                        <td className="flex gap-4 p-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdate(college.id, college.name)
                            }
                            className="underline underline-offset-4"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(college.id)}
                            className="text-[#8d1b39] underline underline-offset-4"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}