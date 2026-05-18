import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import SidebarLayout from "../layouts/SidebarLayout";
import {
  getColleges,
  createCollege,
  updateCollege,
  deleteCollege,
  getCollegeBuildingCount,
} from "../colleges";
import { getCurrentUserRole } from "../auth";
import { useToast } from "../components/ToastProvider";

export default function AdminColleges() {
  const { showToast } = useToast();

  const [role, setRole] = useState<string | null>(null);
  const [colleges, setColleges] = useState<any[]>([]);
  const [newCollege, setNewCollege] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [editModal, setEditModal] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      const currentRole = await getCurrentUserRole();
      setRole(currentRole);

      if (currentRole === "admin") {
        await load();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load colleges", "error");
    } finally {
      setLoading(false);
    }
  }

  async function load() {
    const data = await getColleges();
    setColleges(data || []);
  }

  function collegeNameExists(name: string, ignoredId?: number) {
    const normalized = name.trim().toLowerCase();
  
    return colleges.some((college) => {
      if (ignoredId && college.id === ignoredId) return false;
      return String(college.name || "").trim().toLowerCase() === normalized;
    });
  }

  async function handleCreate() {
    const name = newCollege.trim();
  
    if (!name) {
      showToast("College name cannot be empty", "warning");
      return;
    }
  
    if (collegeNameExists(name)) {
      showToast("That college already exists", "warning");
      return;
    }
  
    try {
      setProcessing(true);
      await createCollege(name);
      setNewCollege("");
      await load();
      showToast("College added", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to add college", "error");
    } finally {
      setProcessing(false);
    }
  }

  function openEditModal(college: any) {
    setEditModal({
      id: college.id,
      name: college.name,
    });
  }

  async function handleUpdate() {
    if (!editModal) return;
  
    const name = editModal.name.trim();
  
    if (!name) {
      showToast("College name cannot be empty", "warning");
      return;
    }
  
    if (collegeNameExists(name, editModal.id)) {
      showToast("That college already exists", "warning");
      return;
    }
  
    try {
      setProcessing(true);
      await updateCollege(editModal.id, name);
      setEditModal(null);
      await load();
      showToast("College updated", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to update college", "error");
    } finally {
      setProcessing(false);
    }
  }

  async function requestDelete(college: any) {
    try {
      const buildingCount = await getCollegeBuildingCount(college.id);
  
      if (buildingCount > 0) {
        showToast(
          `Cannot delete this college because ${buildingCount} building${
            buildingCount !== 1 ? "s are" : " is"
          } still assigned to it.`,
          "warning"
        );
        return;
      }
  
      setConfirmModal({
        title: "Delete college?",
        message: `Are you sure you want to delete ${college.name}?`,
        onConfirm: async () => {
          await deleteCollege(college.id);
          await load();
        },
      });
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to check college usage", "error");
    }
  }

  async function handleConfirmAction() {
    if (!confirmModal) return;

    try {
      setProcessing(true);
      await confirmModal.onConfirm();
      setConfirmModal(null);
      showToast("College deleted", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to delete college", "error");
    } finally {
      setProcessing(false);
    }
  }

  const filteredColleges = useMemo(() => {
    return colleges.filter((college) =>
      college.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [colleges, search]);

  return (
    <SidebarLayout background="white">
      <div className="min-h-screen bg-white p-6">
        <AnimatePresence>
          {confirmModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="ml-15 flex flex-col items-center gap-3 rounded-2xl border border-white/40 bg-white/90 px-10 py-6 shadow-xl backdrop-blur-md"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-center text-xl font-semibold text-black/90">
                  {confirmModal.title}
                </p>

                <p className="max-w-sm text-center text-sm text-black/60">
                  {confirmModal.message}
                </p>

                <div className="mt-2 flex gap-5">
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={processing}
                    className="rounded-lg bg-upgreen px-5 py-2 text-white/90 transition hover:scale-110 disabled:opacity-50"
                  >
                    ✔
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    disabled={processing}
                    className="rounded-lg bg-upred px-5 py-2 text-white/90 transition hover:scale-110 disabled:opacity-50"
                  >
                    ✖
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="ml-15 w-full max-w-md rounded-2xl border border-white/40 bg-white/90 p-6 shadow-xl backdrop-blur-md"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-bold text-upred">
                  Edit College
                </h2>

                <p className="mt-1 text-sm text-black/60">
                  Update the college name.
                </p>

                <input
                  value={editModal.name}
                  onChange={(e) =>
                    setEditModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            name: e.target.value,
                          }
                        : prev
                    )
                  }
                  className="mt-5 w-full rounded-lg border border-upred/30 bg-white/90 p-3"
                />

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModal(null)}
                    disabled={processing}
                    className="rounded-xl border border-upred/30 px-5 py-2 text-sm font-medium text-upred transition hover:bg-upred/10 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={processing}
                    className="rounded-xl bg-upgreen px-5 py-2 text-sm font-medium text-white transition hover:scale-105 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-4 flex w-full justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold leading-none text-upred">
              Manage Colleges
            </h1>
            <p className="mt-2 text-sm text-black/60">
              Add, update, or remove colleges used in the building inventory.
            </p>
          </div>
        </div>

        <div className="mb-6 h-px w-full bg-black/10" />

        {loading ? (
          <p className="text-center text-black/60">Loading colleges...</p>
        ) : role !== "admin" ? (
          <p className="text-center font-medium text-upred">
            Access denied. Admins only.
          </p>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-upgreen/15 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
                <h2 className="text-lg font-bold text-upgreen">Add College</h2>

                <p className="mt-1 text-sm text-black/60">
                  Create a new college option for building records.
                </p>

                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <input
                    placeholder="New college name"
                    value={newCollege}
                    onChange={(e) => setNewCollege(e.target.value)}
                    className="w-full rounded-lg border border-upgreen/30 bg-white/90 p-3"
                  />

                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={processing}
                    className="rounded-xl bg-upgreen px-5 py-3 text-sm font-medium text-white transition hover:scale-105 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-upyellow/30 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
                <h2 className="text-lg font-bold text-upyellow">Search</h2>

                <p className="mt-1 text-sm text-black/60">
                  Find a college by name.
                </p>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search colleges"
                  className="mt-4 w-full rounded-lg border border-upyellow/50 bg-white/90 p-3"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-upred/15 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
              <div className="mb-4 flex flex-col gap-1">
                <h2 className="text-xl font-bold text-upred">
                  College List
                </h2>

                <p className="text-sm text-black/60">
                  {filteredColleges.length} college
                  {filteredColleges.length !== 1 && "s"} found
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-upred/15">
                <table className="min-w-full text-sm">
                  <thead className="bg-upred text-white">
                    <tr>
                      <th className="p-3 text-left">College Name</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredColleges.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="p-4 text-center text-black/60">
                          No colleges found.
                        </td>
                      </tr>
                    ) : (
                      filteredColleges.map((college) => (
                        <tr
                          key={college.id}
                          className="border-t border-upred/10 hover:bg-upred/5"
                        >
                          <td className="p-3 font-medium text-black">
                            {college.name}
                          </td>

                          <td className="p-3">
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => openEditModal(college)}
                                title="Edit college"
                                className="text-upgreen transition hover:scale-110"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => requestDelete(college)}
                                title="Delete college"
                                className="text-upred transition hover:scale-110"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}