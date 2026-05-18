// src/pages/ServiceRequests.tsx

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { useToast } from "../components/ToastProvider";
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

type StatusType = "pending" | "cancelled" | "resolved";

export default function ServiceRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(() => {
    return sessionStorage.getItem("bims_role");
  });

  const [submitting, setSubmitting] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const [buildings, setBuildings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const { showToast } = useToast();

  const [statusModal, setStatusModal] = useState<{
    id: number;
    title: string;
    nextStatus: StatusType;
  } | null>(null);

  const [processingStatus, setProcessingStatus] = useState(false);
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    building_id: "",
    floor_id: "",
    room_id: "",
  });

  useEffect(() => {
    async function initialize() {
      await Promise.all([loadRole(), loadRequests(), loadBuildings()]);
    }

    initialize();
  }, []);

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

    if (data?.role) {
      setRole(data.role);
      sessionStorage.setItem("bims_role", data.role);
    }
  }

  async function loadBuildings() {
    try {
      const data = await getBuildings();
      setBuildings(data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load buildings", "error");
    }
  }

  async function loadRequests() {
    try {
      setLoadingRequests(true);
      const data = await getServiceRequests();
      setRequests(data || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load service requests", "error");
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

  function isStaff() {
    return role === "staff";
  }

  function canManageStatus() {
    return isAdmin() || isChief();
  }

  function getStatusBadgeClass(status: string) {
    if (status === "resolved") {
      return "border-upgreen/20 bg-upgreen/10 text-upgreen";
    }

    if (status === "cancelled") {
      return "border-upred/20 bg-upred/10 text-upred";
    }

    return "border-upyellow/30 bg-upyellow/20 text-black";
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
      showToast("Title is required", "warning");
      return;
    }
  
    if (!form.description.trim()) {
      showToast("Description is required", "warning");
      return;
    }
  
    try {
      setSubmitting(true);
  
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      if (!user) {
        showToast("You must be logged in", "warning");
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
      setShowRequestForm(false);
  
      await loadRequests();
      showToast("Service request submitted", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to submit request", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function requestStatusChange(id: number, title: string, nextStatus: StatusType) {
    setStatusModal({
      id,
      title,
      nextStatus,
    });
  }

  async function handleConfirmStatusChange() {
    if (!statusModal) return;
  
    try {
      setProcessingStatus(true);
  
      const nextStatus = statusModal.nextStatus;
  
      await updateServiceRequestStatus(statusModal.id, nextStatus);
      setStatusModal(null);
      await loadRequests();
  
      showToast(
        `Request marked as ${formatStatus(nextStatus).toLowerCase()}.`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to update status", "error");
    } finally {
      setProcessingStatus(false);
    }
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("");
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus = statusFilter ? request.status === statusFilter : true;

      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        searchText === ""
          ? true
          : request.title?.toLowerCase().includes(searchText) ||
            request.description?.toLowerCase().includes(searchText) ||
            request.buildings?.building_name?.toLowerCase().includes(searchText);

      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, search]);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests]
  );

  const cancelledRequests = useMemo(
    () => requests.filter((request) => request.status === "cancelled"),
    [requests]
  );

  const resolvedRequests = useMemo(
    () => requests.filter((request) => request.status === "resolved"),
    [requests]
  );

  const statCards = useMemo(() => {
    return [
      {
        label: "Requests",
        value: requests.length,
        color: "bg-upred",
      },
      {
        label: "Pending",
        value: pendingRequests.length,
        color: "bg-upyellow",
      },
      {
        label: "Resolved",
        value: resolvedRequests.length,
        color: "bg-upgreen",
      },
      {
        label: "Cancelled",
        value: cancelledRequests.length,
        color: "bg-upred",
      },
    ];
  }, [
    requests.length,
    pendingRequests.length,
    resolvedRequests.length,
    cancelledRequests.length,
  ]);

  return (
    <SidebarLayout background="white">
      <div className="min-h-screen bg-white p-6">
        <AnimatePresence>
          {statusModal && (
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
                  Update request status?
                </p>

                <p className="max-w-sm text-center text-sm text-black/60">
                  Change "{statusModal.title}" to{" "}
                  <span className="font-semibold">
                    {formatStatus(statusModal.nextStatus)}
                  </span>
                  ?
                </p>

                <div className="mt-2 flex gap-5">
                  <button
                    type="button"
                    onClick={handleConfirmStatusChange}
                    disabled={processingStatus}
                    className="rounded-lg bg-upgreen px-5 py-2 text-white/90 transition hover:scale-110 disabled:opacity-50"
                  >
                    ✔
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusModal(null)}
                    disabled={processingStatus}
                    className="rounded-lg bg-upred px-5 py-2 text-white/90 transition hover:scale-110 disabled:opacity-50"
                  >
                    ✖
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-4 flex w-full justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold leading-none text-upred">
              Service Requests
            </h1>
            <p className="mt-2 text-sm text-black/60">
              Submit, review, and manage facility-related requests.
            </p>
          </div>
        </div>

        <div className="mb-6 h-px w-full bg-black/10" />

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`flex min-h-24 flex-col justify-center rounded-2xl border border-white/40 px-5 py-4 shadow-md backdrop-blur-sm ${card.color} text-white/90 transition hover:scale-105 hover:text-white hover:shadow-lg`}
            >
              <div className="text-sm font-medium">{card.label}</div>
              <div className="text-3xl font-extrabold">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div />

          <div className="flex justify-center">
            <div className="inline-flex overflow-hidden rounded-xl border border-upred/30 bg-white/90">
              <button
                type="button"
                onClick={() => setStatusFilter("")}
                className={`px-5 py-2 text-sm font-medium transition ${
                  statusFilter === ""
                    ? "bg-upred text-white"
                    : "text-upred hover:bg-upred/10"
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-5 py-2 text-sm font-medium transition ${
                  statusFilter === "pending"
                    ? "bg-upred text-white"
                    : "text-upred hover:bg-upred/10"
                }`}
              >
                Pending
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("resolved")}
                className={`px-5 py-2 text-sm font-medium transition ${
                  statusFilter === "resolved"
                    ? "bg-upred text-white"
                    : "text-upred hover:bg-upred/10"
                }`}
              >
                Resolved
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("cancelled")}
                className={`px-5 py-2 text-sm font-medium transition ${
                  statusFilter === "cancelled"
                    ? "bg-upred text-white"
                    : "text-upred hover:bg-upred/10"
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>

          <div className="flex justify-center gap-3 md:justify-end">
            {isStaff() && (
              <button
                type="button"
                onClick={() => setShowRequestForm((prev) => !prev)}
                className={`rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium transition ${
                  showRequestForm
                    ? "bg-upgreen text-white"
                    : "text-upgreen hover:bg-upgreen/10"
                }`}
              >
                {showRequestForm ? "Hide Form" : "Submit Request"}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium transition ${
                showFilters
                  ? "bg-upgreen text-white"
                  : "text-upgreen hover:bg-upgreen/10"
              }`}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isStaff() && showRequestForm && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onMouseDown={() => setShowRequestForm(false)}
            >
              <motion.form
                onSubmit={handleSubmit}
                onMouseDown={(e) => e.stopPropagation()}
                className="relative ml-15 w-full max-w-4xl rounded-2xl border border-white/40 bg-white/95 p-6 shadow-xl backdrop-blur-md"
                initial={{ scale: 0.9, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 12 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  title="Close form"
                  className="absolute right-5 top-5 rounded-full p-2 text-black/50 transition hover:bg-upred/10 hover:text-upred"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="mb-5 text-center">
                  <h2 className="text-3xl font-extrabold leading-none text-upred">
                    Submit Request
                  </h2>

                  <p className="mt-2 text-sm text-black/60">
                    Provide request details and optionally link it to a building, floor, or room.
                  </p>
                </div>

                <div className="mb-6 h-px w-full bg-black/10" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Building</label>
                    <select
                      name="building_id"
                      value={form.building_id}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-upred/30 bg-white/90 p-3"
                    >
                      <option value="">No building selected</option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.building_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Floor</label>
                    <select
                      name="floor_id"
                      value={form.floor_id}
                      onChange={handleChange}
                      disabled={!form.building_id}
                      className={`w-full rounded-lg border border-upred/30 p-3 ${
                        !form.building_id
                          ? "cursor-not-allowed bg-black/5 text-black/40"
                          : "bg-white/90"
                      }`}
                    >
                      <option value="">No floor selected</option>
                      {floors.map((floor) => (
                        <option key={floor.id} value={floor.id}>
                          Floor {floor.floor_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Room</label>
                    <select
                      name="room_id"
                      value={form.room_id}
                      onChange={handleChange}
                      disabled={!form.floor_id}
                      className={`w-full rounded-lg border border-upred/30 p-3 ${
                        !form.floor_id
                          ? "cursor-not-allowed bg-black/5 text-black/40"
                          : "bg-white/90"
                      }`}
                    >
                      <option value="">No room selected</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          Room {room.room_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-1 block text-sm font-medium">
                      Title <span className="text-upred">*</span>
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      placeholder="Request title"
                      className="w-full rounded-lg border border-upred/30 bg-white/90 p-3"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-1 block text-sm font-medium">
                      Description <span className="text-upred">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Describe the concern or request"
                      className="w-full resize-none rounded-lg border border-upred/30 bg-white/90 p-3"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    disabled={submitting}
                    className="rounded-xl border border-upred/30 px-5 py-2 text-sm font-medium text-upred transition hover:bg-upred/10 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-upred px-5 py-2 text-sm font-medium text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        {!isStaff() && (
          <p className="mb-6 text-center text-sm text-black/50">
            You can review and manage service requests. Only staff can submit new
            requests.
          </p>
        )}

        {showFilters && (
          <div className="mb-6 flex w-full justify-center">
            <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Search Requests
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, description, or building"
                  className="w-full rounded-lg border border-upred/30 bg-white/90 p-3"
                />
              </div>

              {(search || statusFilter) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-xl border border-upgreen/30 px-5 py-3 text-sm font-medium text-upgreen transition hover:bg-upgreen/10"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-upred/15 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-xl font-bold text-upred">Submitted Requests</h2>

            <p className="text-sm text-black/60">
              {filteredRequests.length} request
              {filteredRequests.length !== 1 && "s"} found
            </p>
          </div>

          {loadingRequests ? (
            <p className="rounded-xl border border-black/10 bg-white/80 px-4 py-6 text-center text-black/50">
              Loading service requests...
            </p>
          ) : filteredRequests.length === 0 ? (
            <p className="rounded-xl border border-black/10 bg-white/80 px-4 py-6 text-center text-black/50">
              No service requests found.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border border-black/10 bg-white/90 p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-black">
                          {request.title}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            request.status
                          )}`}
                        >
                          {formatStatus(request.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm text-black/60 md:grid-cols-3">
                        <p>
                          <span className="font-semibold text-black">
                            Building:
                          </span>{" "}
                          {request.buildings?.building_name || "Not specified"}
                        </p>

                        <p>
                          <span className="font-semibold text-black">Floor:</span>{" "}
                          {request.floors?.floor_number
                            ? `Floor ${request.floors.floor_number}`
                            : "Not specified"}
                        </p>

                        <p>
                          <span className="font-semibold text-black">Room:</span>{" "}
                          {request.rooms?.room_number
                            ? `Room ${request.rooms.room_number}`
                            : "Not specified"}
                        </p>
                      </div>

                      <p className="mt-2 text-xs text-black/40">
                        {request.created_at
                          ? new Date(request.created_at).toLocaleString()
                          : "No date"}
                      </p>

                      <p className="mt-3 text-sm text-black">
                        {request.description}
                      </p>
                    </div>

                    {canManageStatus() && (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {request.status !== "pending" && (
                          <button
                            type="button"
                            onClick={() =>
                              requestStatusChange(request.id, request.title, "pending")
                            }
                            className="rounded-xl border border-upyellow/40 px-4 py-2 text-sm font-medium text-black transition hover:bg-upyellow/20"
                          >
                            Mark Pending
                          </button>
                        )}

                        {request.status !== "resolved" && (
                          <button
                            type="button"
                            onClick={() =>
                              requestStatusChange(request.id, request.title, "resolved")
                            }
                            className="rounded-xl border border-upgreen/30 px-4 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10"
                          >
                            <Check className="mr-1 inline h-4 w-4" />
                            Mark Resolved
                          </button>
                        )}

                        {request.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() =>
                              requestStatusChange(request.id, request.title, "cancelled")
                            }
                            className="rounded-xl border border-upred/30 px-4 py-2 text-sm font-medium text-upred transition hover:bg-upred/10"
                          >
                            <X className="mr-1 inline h-4 w-4" />
                            Cancel Request
                          </button>
                        )}
                      </div>
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