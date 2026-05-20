import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
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
import { getColleges } from "../colleges";

type StatusType =
  | "pending"
  | "acknowledged"
  | "resolved"
  | "rejected"
  | "cancelled";

function normalizeText(value: any) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function ServiceRequests() {
  const { showToast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(() => {
    return sessionStorage.getItem("bims_role");
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const [colleges, setColleges] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const [showCollegeFilterDropdown, setShowCollegeFilterDropdown] =
    useState(false);
  const [showBuildingDropdown, setShowBuildingDropdown] = useState(false);
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    building_id: "",
    floor_id: "",
    room_id: "",
  });

  const [statusModal, setStatusModal] = useState<{
    id: number;
    title: string;
    nextStatus: StatusType;
  } | null>(null);

  const [processingStatus, setProcessingStatus] = useState(false);

  const selectedCollegeFilterName = useMemo(() => {
    if (!collegeFilter) return "All Colleges";

    return (
      colleges.find((college) => String(college.id) === String(collegeFilter))
        ?.name || "All Colleges"
    );
  }, [colleges, collegeFilter]);

  const selectedBuildingName = useMemo(() => {
    if (!form.building_id) return "No building selected";

    return (
      buildings.find((building) => String(building.id) === String(form.building_id))
        ?.building_name || "No building selected"
    );
  }, [buildings, form.building_id]);

  const selectedFloorName = useMemo(() => {
    if (!form.floor_id) return "No floor selected";

    const selectedFloor = floors.find(
      (floor) => String(floor.id) === String(form.floor_id)
    );

    return selectedFloor ? `Floor ${selectedFloor.floor_number}` : "No floor selected";
  }, [floors, form.floor_id]);

  const selectedRoomName = useMemo(() => {
    if (!form.room_id) return "No room selected";

    const selectedRoom = rooms.find(
      (room) => String(room.id) === String(form.room_id)
    );

    return selectedRoom ? `Room ${selectedRoom.room_number}` : "No room selected";
  }, [rooms, form.room_id]);

  useEffect(() => {
    async function initialize() {
      await Promise.all([
        loadRole(),
        loadRequests(),
        loadBuildings(),
        loadColleges(),
      ]);
    }

    initialize();
  }, []);

  async function loadRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setCurrentUserId(user.id);

    const { data } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (data?.status === "approved" && data?.role) {
      setRole(data.role);
      sessionStorage.setItem("bims_role", data.role);
    }
  }

  async function loadColleges() {
    try {
      const data = await getColleges();
      setColleges(data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load colleges", "error");
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

  function canStaffCancelRequest(request: any) {
    return (
      isStaff() &&
      request.submitted_by === currentUserId &&
      ["pending", "acknowledged"].includes(request.status)
    );
  }

  function getStatusBadgeClass(status: string) {
    if (status === "pending") {
      return "border-black/10 bg-black/5 text-black/60";
    }

    if (status === "acknowledged") {
      return "border-upyellow/30 bg-upyellow/20 text-black";
    }

    if (status === "resolved") {
      return "border-upgreen/20 bg-upgreen/10 text-upgreen";
    }

    if (status === "rejected") {
      return "border-upred/20 bg-upred/10 text-upred";
    }

    if (status === "cancelled") {
      return "border-black/20 bg-black/10 text-black/70";
    }

    return "border-black/10 bg-black/5 text-black/60";
  }

  function formatStatus(status: string) {
    if (status === "pending") return "Pending";
    if (status === "acknowledged") return "Acknowledged";
    if (status === "resolved") return "Resolved";
    if (status === "rejected") return "Rejected";
    if (status === "cancelled") return "Cancelled";
    return status;
  }

  function getSubmittedByLabel(request: any) {
    const profile = request.profiles;

    if (profile?.full_name) return profile.full_name;
    if (profile?.email) return profile.email;
    if (request.submitted_by) return "Registered user";

    return "Not specified";
  }

  function closeRequestForm() {
    setShowRequestForm(false);
    setShowBuildingDropdown(false);
    setShowFloorDropdown(false);
    setShowRoomDropdown(false);
  }

  function handleTextChange(e: any) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleBuildingSelect(value: string) {
    setShowBuildingDropdown(false);

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

    try {
      const floorData = await getFloorsByBuilding(Number(value));

      setFloors(floorData || []);
      setRooms([]);

      setForm((prev) => ({
        ...prev,
        building_id: value,
        floor_id: "",
        room_id: "",
      }));
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load floors", "error");
    }
  }

  async function handleFloorSelect(value: string) {
    setShowFloorDropdown(false);

    if (!value) {
      setRooms([]);
      setForm((prev) => ({
        ...prev,
        floor_id: "",
        room_id: "",
      }));
      return;
    }

    try {
      const roomData = await getRoomsByFloor(Number(value));

      setRooms(roomData || []);

      setForm((prev) => ({
        ...prev,
        floor_id: value,
        room_id: "",
      }));
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load rooms", "error");
    }
  }

  function handleRoomSelect(value: string) {
    setShowRoomDropdown(false);

    setForm((prev) => ({
      ...prev,
      room_id: value,
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
      closeRequestForm();

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
        nextStatus === "cancelled"
          ? "Request cancelled."
          : `Request marked as ${formatStatus(nextStatus).toLowerCase()}.`,
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
    setCollegeFilter("");
    setShowCollegeFilterDropdown(false);
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const isOwnCancelledRequest =
        request.status === "cancelled" && request.submitted_by === currentUserId;

      if (request.status === "cancelled" && !isOwnCancelledRequest) {
        return false;
      }

      if (statusFilter === "cancelled") {
        if (!isOwnCancelledRequest) return false;
      } else if (statusFilter) {
        if (request.status !== statusFilter) return false;
      }

      const requestCollegeId =
        request.buildings?.college_id !== null &&
        request.buildings?.college_id !== undefined
          ? String(request.buildings.college_id)
          : "";

      if (collegeFilter && requestCollegeId !== collegeFilter) {
        return false;
      }

      const searchText = normalizeText(search);

      if (!searchText) return true;

      const searchableValues = [
        request.title,
        request.description,
        request.buildings?.building_name,
        request.buildings?.colleges?.name,
        request.floors?.floor_number
          ? `Floor ${request.floors.floor_number}`
          : "",
        request.rooms?.room_number ? `Room ${request.rooms.room_number}` : "",
        getSubmittedByLabel(request),
      ];

      return searchableValues.some((value) =>
        normalizeText(value).includes(searchText)
      );
    });
  }, [requests, statusFilter, collegeFilter, search, currentUserId]);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests]
  );

  const acknowledgedRequests = useMemo(
    () => requests.filter((request) => request.status === "acknowledged"),
    [requests]
  );

  const resolvedRequests = useMemo(
    () => requests.filter((request) => request.status === "resolved"),
    [requests]
  );

  const rejectedRequests = useMemo(
    () => requests.filter((request) => request.status === "rejected"),
    [requests]
  );

  const statCards = useMemo(() => {
    return [
      {
        label: "Pending",
        value: pendingRequests.length,
        color: "bg-white",
        text: "text-black",
      },
      {
        label: "Acknowledged",
        value: acknowledgedRequests.length,
        color: "bg-upyellow",
        text: "text-white",
      },
      {
        label: "Resolved",
        value: resolvedRequests.length,
        color: "bg-upgreen",
        text: "text-white",
      },
      {
        label: "Rejected",
        value: rejectedRequests.length,
        color: "bg-upred",
        text: "text-white",
      },
    ];
  }, [
    pendingRequests.length,
    acknowledgedRequests.length,
    resolvedRequests.length,
    rejectedRequests.length,
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
                  {statusModal.nextStatus === "cancelled"
                    ? "Cancel request?"
                    : "Update request status?"}
                </p>

                <p className="max-w-sm text-center text-sm text-black/60">
                  {statusModal.nextStatus === "cancelled" ? (
                    <>
                      Mark "{statusModal.title}" as{" "}
                      <span className="font-semibold">Cancelled</span>?
                    </>
                  ) : (
                    <>
                      Change "{statusModal.title}" to{" "}
                      <span className="font-semibold">
                        {formatStatus(statusModal.nextStatus)}
                      </span>
                      ?
                    </>
                  )}
                </p>

                <div className="mt-2 flex gap-5">
                  <button
                    type="button"
                    onClick={handleConfirmStatusChange}
                    disabled={processingStatus}
                    className="rounded-lg bg-upgreen px-5 py-2 text-white/90 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ✔
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusModal(null)}
                    disabled={processingStatus}
                    className="rounded-lg bg-upred px-5 py-2 text-white/90 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
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

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`flex min-h-24 flex-col justify-center rounded-2xl border border-black/10 px-5 py-4 shadow-md backdrop-blur-sm ${card.color} ${card.text} transition hover:scale-105 hover:shadow-lg`}
            >
              <div className="text-sm font-medium">{card.label}</div>
              <div className="text-3xl font-extrabold">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div />

          <div className="flex justify-center">
            <div className="inline-flex flex-wrap justify-center overflow-hidden rounded-xl border border-black/10 bg-white/90">
              <button
                type="button"
                onClick={() => setStatusFilter("")}
                className={`px-5 py-2 text-sm font-medium transition ${
                  statusFilter === ""
                    ? "bg-black/5 text-black"
                    : "text-black/60 hover:bg-black/5"
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-5 py-2 text-sm font-medium transition ${
                  statusFilter === "pending"
                    ? "bg-black/5 text-black"
                    : "text-black/60 hover:bg-black/5"
                }`}
              >
                Pending
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("acknowledged")}
                className={`px-5 py-2 text-sm font-medium transition ${
                  statusFilter === "acknowledged"
                    ? "bg-upyellow/20 text-black"
                    : "text-black/70 hover:bg-upyellow/10"
                }`}
              >
                Acknowledged
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("resolved")}
                className={`px-5 py-2 text-sm font-medium transition ${
                  statusFilter === "resolved"
                    ? "bg-upgreen/10 text-upgreen"
                    : "text-upgreen hover:bg-upgreen/10"
                }`}
              >
                Resolved
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("rejected")}
                className={`px-5 py-2 text-sm font-medium transition ${
                  statusFilter === "rejected"
                    ? "bg-upred/10 text-upred"
                    : "text-upred hover:bg-upred/10"
                }`}
              >
                Rejected
              </button>

              {isStaff() && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("cancelled")}
                  className={`px-5 py-2 text-sm font-medium transition ${
                    statusFilter === "cancelled"
                      ? "bg-black/10 text-black"
                      : "text-black/60 hover:bg-black/5"
                  }`}
                >
                  Cancelled
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-3 md:justify-end">
            {isStaff() && (
              <button
                type="button"
                onClick={() => setShowRequestForm(true)}
                className="rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit Request
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium transition ${
                showFilters
                  ? "bg-upgreen/10 text-upgreen"
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
              onMouseDown={closeRequestForm}
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
                  onClick={closeRequestForm}
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
                  <div className="relative">
                    <label className="mb-1 block text-sm font-medium">
                      Building
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setShowBuildingDropdown((prev) => !prev);
                        setShowFloorDropdown(false);
                        setShowRoomDropdown(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-upred/30 bg-white/90 p-3 text-left transition hover:border-upred/50"
                    >
                      <span className={form.building_id ? "text-black" : "text-black/40"}>
                        {selectedBuildingName}
                      </span>

                      <ChevronDown
                        className={`h-5 w-5 text-black/50 transition ${
                          showBuildingDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showBuildingDropdown && (
                      <div className="absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-upred/20 bg-white shadow-xl">
                        <button
                          type="button"
                          onClick={() => handleBuildingSelect("")}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                            !form.building_id ? "font-semibold text-upred" : "text-black"
                          }`}
                        >
                          No building selected
                          {!form.building_id && <Check className="h-4 w-4" />}
                        </button>

                        {buildings.map((building) => {
                          const selected = String(building.id) === String(form.building_id);

                          return (
                            <button
                              key={building.id}
                              type="button"
                              onClick={() => handleBuildingSelect(String(building.id))}
                              className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                                selected ? "font-semibold text-upred" : "text-black"
                              }`}
                            >
                              {building.building_name}
                              {selected && <Check className="h-4 w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="mb-1 block text-sm font-medium">
                      Floor
                    </label>

                    <button
                      type="button"
                      disabled={!form.building_id}
                      onClick={() => {
                        if (!form.building_id) return;
                        setShowFloorDropdown((prev) => !prev);
                        setShowBuildingDropdown(false);
                        setShowRoomDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg border border-upred/30 p-3 text-left transition ${
                        !form.building_id
                          ? "cursor-not-allowed bg-black/5 text-black/40"
                          : "bg-white/90 hover:border-upred/50"
                      }`}
                    >
                      <span className={form.floor_id ? "text-black" : "text-black/40"}>
                        {selectedFloorName}
                      </span>

                      <ChevronDown
                        className={`h-5 w-5 text-black/50 transition ${
                          showFloorDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showFloorDropdown && (
                      <div className="absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-upred/20 bg-white shadow-xl">
                        <button
                          type="button"
                          onClick={() => handleFloorSelect("")}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                            !form.floor_id ? "font-semibold text-upred" : "text-black"
                          }`}
                        >
                          No floor selected
                          {!form.floor_id && <Check className="h-4 w-4" />}
                        </button>

                        {floors.map((floor) => {
                          const selected = String(floor.id) === String(form.floor_id);

                          return (
                            <button
                              key={floor.id}
                              type="button"
                              onClick={() => handleFloorSelect(String(floor.id))}
                              className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                                selected ? "font-semibold text-upred" : "text-black"
                              }`}
                            >
                              Floor {floor.floor_number}
                              {selected && <Check className="h-4 w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="mb-1 block text-sm font-medium">
                      Room
                    </label>

                    <button
                      type="button"
                      disabled={!form.floor_id}
                      onClick={() => {
                        if (!form.floor_id) return;
                        setShowRoomDropdown((prev) => !prev);
                        setShowBuildingDropdown(false);
                        setShowFloorDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg border border-upred/30 p-3 text-left transition ${
                        !form.floor_id
                          ? "cursor-not-allowed bg-black/5 text-black/40"
                          : "bg-white/90 hover:border-upred/50"
                      }`}
                    >
                      <span className={form.room_id ? "text-black" : "text-black/40"}>
                        {selectedRoomName}
                      </span>

                      <ChevronDown
                        className={`h-5 w-5 text-black/50 transition ${
                          showRoomDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showRoomDropdown && (
                      <div className="absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-upred/20 bg-white shadow-xl">
                        <button
                          type="button"
                          onClick={() => handleRoomSelect("")}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                            !form.room_id ? "font-semibold text-upred" : "text-black"
                          }`}
                        >
                          No room selected
                          {!form.room_id && <Check className="h-4 w-4" />}
                        </button>

                        {rooms.map((room) => {
                          const selected = String(room.id) === String(form.room_id);

                          return (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => handleRoomSelect(String(room.id))}
                              className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                                selected ? "font-semibold text-upred" : "text-black"
                              }`}
                            >
                              Room {room.room_number}
                              {selected && <Check className="h-4 w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-1 block text-sm font-medium">
                      Request Title <span className="text-upred">*</span>
                    </label>

                    <input
                      name="title"
                      value={form.title}
                      onChange={handleTextChange}
                      placeholder="Enter request title"
                      className="w-full rounded-lg border border-upred/30 bg-white/90 p-3 transition focus:border-upred focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-1 block text-sm font-medium">
                      Description <span className="text-upred">*</span>
                    </label>

                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleTextChange}
                      placeholder="Describe the request"
                      rows={5}
                      className="w-full resize-none rounded-lg border border-upred/30 bg-white/90 p-3 transition focus:border-upred focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={closeRequestForm}
                    disabled={submitting}
                    className="rounded-xl border border-upred/30 px-5 py-2 text-sm font-medium text-upred transition hover:bg-upred/10 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-2 md:items-end">

              <div className="relative">
                <label className="mb-1 block text-sm font-medium">
                  Filter by College
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setShowCollegeFilterDropdown((prev) => !prev)
                  }
                  className="flex w-full items-center justify-between rounded-lg border border-upred/30 bg-white/90 p-3 text-left transition hover:border-upred/50"
                >
                  <span>{selectedCollegeFilterName}</span>

                  <ChevronDown
                    className={`h-5 w-5 text-black/50 transition ${
                      showCollegeFilterDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showCollegeFilterDropdown && (
                  <div className="absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-upred/20 bg-white shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setCollegeFilter("");
                        setShowCollegeFilterDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                        !collegeFilter ? "font-semibold text-upred" : "text-black"
                      }`}
                    >
                      All Colleges
                      {!collegeFilter && <Check className="h-4 w-4" />}
                    </button>

                    {colleges.map((college) => {
                      const isSelected =
                        String(college.id) === String(collegeFilter);

                      return (
                        <button
                          key={college.id}
                          type="button"
                          onClick={() => {
                            setCollegeFilter(String(college.id));
                            setShowCollegeFilterDropdown(false);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                            isSelected ? "font-semibold text-upred" : "text-black"
                          }`}
                        >
                          {college.name}
                          {isSelected && <Check className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Search Requests
                </label>

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                  placeholder="college, building, room, floor, description, submitter"
                  className="w-full rounded-lg border border-upred/30 bg-white/90 p-3"
                />
              </div>

              {(search || statusFilter || collegeFilter) && (
                <div className="flex justify-center md:col-span-2">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="rounded-xl border border-upred/30 px-5 py-2 text-sm font-medium text-upred transition hover:bg-upred/10"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-upred/15 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-upred">Submitted Requests</h2>

            <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-semibold text-black/60">
              {filteredRequests.length}
            </span>
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

                      <div className="grid grid-cols-1 gap-2 text-sm text-black/60 md:grid-cols-4">
                        <p>
                          <span className="font-semibold text-black">
                            Building:
                          </span>{" "}
                          {request.buildings?.building_name || "Not specified"}
                        </p>

                        <p>
                          <span className="font-semibold text-black">
                            Floor:
                          </span>{" "}
                          {request.floors?.floor_number
                            ? `Floor ${request.floors.floor_number}`
                            : "Not specified"}
                        </p>

                        <p>
                          <span className="font-semibold text-black">
                            Room:
                          </span>{" "}
                          {request.rooms?.room_number
                            ? `Room ${request.rooms.room_number}`
                            : "Not specified"}
                        </p>

                        <p>
                          <span className="font-semibold text-black">
                            Submitted By:
                          </span>{" "}
                          {getSubmittedByLabel(request)}
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

                    {(canManageStatus() || canStaffCancelRequest(request)) && (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {canManageStatus() && request.status === "pending" && (
                          <button
                            type="button"
                            onClick={() =>
                              requestStatusChange(
                                request.id,
                                request.title,
                                "acknowledged"
                              )
                            }
                            className="rounded-xl border border-upyellow/40 px-4 py-2 text-sm font-medium text-black transition hover:bg-upyellow/20"
                          >
                            Acknowledged
                          </button>
                        )}

                        {canManageStatus() &&
                          ["pending", "acknowledged"].includes(request.status) && (
                            <button
                              type="button"
                              onClick={() =>
                                requestStatusChange(
                                  request.id,
                                  request.title,
                                  "resolved"
                                )
                              }
                              className="rounded-xl border border-upgreen/30 px-4 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10"
                            >
                              Resolved
                            </button>
                          )}

                        {canManageStatus() &&
                          ["pending", "acknowledged"].includes(request.status) && (
                            <button
                              type="button"
                              onClick={() =>
                                requestStatusChange(
                                  request.id,
                                  request.title,
                                  "rejected"
                                )
                              }
                              className="rounded-xl border border-upred/30 px-4 py-2 text-sm font-medium text-upred transition hover:bg-upred/10"
                            >
                              Rejected
                            </button>
                          )}

                        {canStaffCancelRequest(request) && (
                          <button
                            type="button"
                            onClick={() =>
                              requestStatusChange(
                                request.id,
                                request.title,
                                "cancelled"
                              )
                            }
                            className="rounded-xl border border-black/20 px-4 py-2 text-sm font-medium text-black/70 transition hover:bg-black/5"
                          >
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