import { useLocation, Link } from "react-router-dom";
import { Check, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "../components/ToastProvider";
import SidebarLayout from "../layouts/SidebarLayout";

import { getBuildings, deleteBuilding } from "../buildings";
import { getFloorsByBuilding, createFloor, updateFloor, deleteFloor } from "../floors";
import { getRoomsByFloor, createRoom, updateRoom, deleteRoom } from "../rooms";
import { getColleges } from "../colleges";
import { getAllUsers, getPendingUsers } from "../adminUsers";
import { getServiceRequests } from "../serviceRequests";
import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const location = useLocation();
  const fromLogin = location.state?.fromLogin;

  const { showToast } = useToast();

  const [showFade, setShowFade] = useState(fromLogin);
  const [loading, setLoading] = useState(true);

  const [buildings, setBuildings] = useState<any[]>([]);
  const [floorsMap, setFloorsMap] = useState<Record<number, any[]>>({});
  const [roomsMap, setRoomsMap] = useState<Record<number, any[]>>({});
  const [colleges, setColleges] = useState<any[]>([]);

  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  const [role, setRole] = useState<string | null>(() => {
    return sessionStorage.getItem("bims_role");
  });

  const [fullName, setFullName] = useState(() => {
    return sessionStorage.getItem("bims_full_name") || "";
  });

  const [profileLoaded, setProfileLoaded] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showNameConfirmModal, setShowNameConfirmModal] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [deleting, setDeleting] = useState(false);

  const [newFloor, setNewFloor] = useState<Record<number, string>>({});
  const [newRoom, setNewRoom] = useState<Record<number, string>>({});

  const [editingFloor, setEditingFloor] = useState<{
    id: number;
    value: string;
  } | null>(null);

  const [editingRoom, setEditingRoom] = useState<{
    id: number;
    floorId: number;
    value: string;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "hierarchy">("hierarchy");
  const [showFilters, setShowFilters] = useState(false);

  const [stats, setStats] = useState({
    colleges: 0,
    buildings: 0,
    floors: 0,
    rooms: 0,
    users: 0,
    pendingUsers: 0,
    pendingServiceRequests: 0,
    missingComplianceBuildings: 0,
  });

  const selectedCollegeName = useMemo(() => {
    if (!collegeFilter) return "All Colleges";

    return (
      colleges.find((college) => String(college.id) === collegeFilter)?.name ||
      "All Colleges"
    );
  }, [colleges, collegeFilter]);

  function isAdmin() {
    return role === "admin";
  }

  function isStaff() {
    return role === "staff";
  }

  function isChief() {
    return role === "chief";
  }

  function canEditBuilding() {
    return isAdmin() || isStaff();
  }

  function canDeleteBuilding() {
    return isAdmin();
  }

  function canAddFloors() {
    return isAdmin() || isStaff();
  }

  function canAddRooms() {
    return isAdmin() || isStaff();
  }

  function canRenameFloorRoom() {
    return isAdmin();
  }

  function canDeleteFloorRoom() {
    return isAdmin();
  }

  function canAddMoreFloors(buildingId: number, declaredFloors: number) {
    const existingFloors = floorsMap[buildingId] || [];
    return existingFloors.length < declaredFloors;
  }

  function getRoleLabel() {
    if (isAdmin()) return "Admin";
    if (isStaff()) return "Staff";
    if (isChief()) return "Chief";
    return "System";
  }

  function getRoleTextClass() {
    if (isChief()) return "text-upyellow";
    if (isStaff()) return "text-upgreen";
    if (isAdmin()) return "text-upred";
    return "text-upred";
  }

  function renderAttachment(building: any) {
    const link =
      typeof building.file_link === "string" ? building.file_link.trim() : "";

    if (!building.has_attachment) {
      return <span className="text-black/50">No</span>;
    }

    if (!link) {
      return <span className="text-black/50">Yes, no link</span>;
    }

    return (
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-upred underline underline-offset-4"
      >
        Open
      </a>
    );
  }

  function RestrictedNotice({
    label = "Restricted for your access",
  }: {
    label?: string;
  }) {
    return (
      <span className="inline-flex rounded-full border border-upred/40 bg-upred/10 px-3 py-1 text-xs font-medium text-black/70">
        {label}
      </span>
    );
  }

  useEffect(() => {
    if (fromLogin) {
      const timer = setTimeout(() => setShowFade(false), 600);
      return () => clearTimeout(timer);
    }
  }, [fromLogin]);

  useEffect(() => {
    load();
    loadProfile();
    loadColleges();
  }, []);

  async function loadProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("role, full_name, status")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to load profile:", error);
        return;
      }

      if (data?.status === "approved" && data?.role) {
        setRole(data.role);
        sessionStorage.setItem("bims_role", data.role);
      }

      const loadedName = data?.full_name || "";

      setFullName(loadedName);
      setNameInput(loadedName);

      if (loadedName) {
        sessionStorage.setItem("bims_full_name", loadedName);
      } else {
        sessionStorage.removeItem("bims_full_name");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setProfileLoaded(true);
    }
  }

  async function loadColleges() {
    try {
      const data = await getColleges();
      setColleges(data || []);
    } catch (err) {
      console.error("Failed to load colleges:", err);
    }
  }

  function hasMissingCompliance(building: any) {
    return (
      !building.structural_integrity ||
      !building.retrofitting ||
      !building.ramp ||
      !building.elevator ||
      !building.pwd_restroom ||
      !building.gender_neutral_restroom ||
      !building.generator ||
      !building.cistern ||
      !building.septic_tank ||
      !building.electrical_wiring ||
      !building.lvsg ||
      !building.fdas ||
      !building.fire_protection ||
      !building.ventilation ||
      !building.fiber_lan ||
      !building.cmr_submission ||
      !building.smr_submission ||
      !building.testing_requirements
    );
  }

  async function load() {
    try {
      setLoading(true);

      const currentRole = sessionStorage.getItem("bims_role") || role;
      const shouldLoadAdminStats = currentRole === "admin";

      const [
        buildingData,
        collegeData,
        allUsers,
        pendingUsers,
        serviceRequests,
      ] = await Promise.all([
        getBuildings(),
        getColleges(),
        shouldLoadAdminStats ? getAllUsers() : Promise.resolve([]),
        shouldLoadAdminStats ? getPendingUsers() : Promise.resolve([]),
        getServiceRequests(),
      ]);

      setBuildings(buildingData || []);
      setColleges(collegeData || []);

      const floorsMapping: Record<number, any[]> = {};
      const roomsMapping: Record<number, any[]> = {};

      for (const b of buildingData || []) {
        const floors = await getFloorsByBuilding(b.id);
        floorsMapping[b.id] = floors || [];

        for (const f of floors || []) {
          roomsMapping[f.id] = await getRoomsByFloor(f.id);
        }
      }

      setFloorsMap(floorsMapping);
      setRoomsMap(roomsMapping);

      const floorCount = Object.values(floorsMapping).reduce(
        (sum, arr) => sum + arr.length,
        0
      );

      const roomCount = Object.values(roomsMapping).reduce(
        (sum, arr) => sum + arr.length,
        0
      );

      setStats({
        colleges: collegeData?.length || 0,
        buildings: buildingData?.length || 0,
        floors: floorCount,
        rooms: roomCount,
        users: allUsers?.length || 0,
        pendingUsers: pendingUsers?.length || 0,
        pendingServiceRequests:
          serviceRequests?.filter((request) => request.status === "pending")
            .length || 0,
        missingComplianceBuildings:
          buildingData?.filter((building) => hasMissingCompliance(building))
            .length || 0,
      });
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      showToast("Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveFullName() {
    if (!nameInput.trim()) {
      showToast("Display name cannot be empty.", "warning");
      return;
    }

    try {
      setSavingName(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showToast("You must be logged in.", "warning");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: nameInput.trim(),
        })
        .eq("id", user.id);

      if (error) {
        console.error(error);
        showToast("Failed to save display name.", "error");
        return;
      }

      setFullName(nameInput.trim());
      sessionStorage.setItem("bims_full_name", nameInput.trim());
      setShowNameConfirmModal(false);
      showToast("Display name saved", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save display name.", "error");
    } finally {
      setSavingName(false);
    }
  }

  function handleDelete(building: any) {
    if (!canDeleteBuilding()) {
      showToast("Only admins can delete buildings.", "warning");
      return;
    }

    const buildingFloors = floorsMap[building.id] || [];

    if (buildingFloors.length > 0) {
      showToast("Cannot delete building with existing floors", "warning");
      return;
    }

    setDeleteModal({
      title: "Delete building?",
      message: `Are you sure you want to delete ${building.building_name}?`,
      onConfirm: async () => {
        await deleteBuilding(building.id);
        await load();
      },
    });
  }

  async function handleConfirmDelete() {
    if (!deleteModal) return;

    try {
      setDeleting(true);
      await deleteModal.onConfirm();
      setDeleteModal(null);
      showToast("Deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  }

  function handleClearFilters() {
    setSearch("");
    setCollegeFilter("");
    setShowCollegeDropdown(false);
  }

  async function handleRenameFloor(floorId: number, buildingId: number) {
    if (!canRenameFloorRoom()) {
      showToast("Only admins can rename floors.", "warning");
      return;
    }

    if (!editingFloor || editingFloor.id !== floorId) return;

    const floorValue = editingFloor.value.trim();

    if (!floorValue) {
      showToast("Floor number cannot be empty", "warning");
      return;
    }

    const floorNumber = Number(floorValue);

    if (Number.isNaN(floorNumber) || floorNumber <= 0) {
      showToast("Floor number must be a valid positive number", "warning");
      return;
    }

    const existingFloors = floorsMap[buildingId] || [];
    const alreadyExists = existingFloors.some(
      (floor) =>
        floor.id !== floorId && Number(floor.floor_number) === floorNumber
    );

    if (alreadyExists) {
      showToast("That floor already exists in this building", "warning");
      return;
    }

    try {
      await updateFloor(floorId, floorNumber);
      setEditingFloor(null);
      await load();
      showToast("Floor updated", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to update floor", "error");
    }
  }

  async function handleRenameRoom() {
    if (!canRenameFloorRoom()) {
      showToast("Only admins can rename rooms.", "warning");
      return;
    }
  
    if (!editingRoom) return;
  
    const roomId = editingRoom.id;
    const floorId = editingRoom.floorId;
    const roomNumber = editingRoom.value.trim();
  
    if (!roomNumber) {
      showToast("Room number cannot be empty", "warning");
      return;
    }
  
    const existingRooms = roomsMap[floorId] || [];
    const alreadyExists = existingRooms.some(
      (room) =>
        room.id !== roomId &&
        String(room.room_number).trim().toLowerCase() === roomNumber.toLowerCase()
    );
  
    if (alreadyExists) {
      showToast("That room already exists on this floor", "warning");
      return;
    }
  
    try {
      await updateRoom(roomId, roomNumber);
      setEditingRoom(null);
      await load();
      showToast("Room updated", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to update room", "error");
    }
  }

  async function handleAddRoom(floorId: number) {
    if (!canAddRooms()) {
      showToast("You do not have access to add rooms.", "warning");
      return;
    }

    const roomNumber = (newRoom[floorId] || "").trim();

    if (!roomNumber) {
      showToast("Room number cannot be empty", "warning");
      return;
    }

    try {
      await createRoom(floorId, roomNumber);

      setNewRoom({
        ...newRoom,
        [floorId]: "",
      });

      await load();
      showToast("Room added", "success");
    } catch (err: any) {
      console.error(err);

      if (err.message?.includes("unique_room_per_floor")) {
        showToast("That room already exists on this floor", "warning");
      } else {
        showToast("Failed to add room", "error");
      }
    }
  }

  async function handleAddFloor(building: any) {
    if (!canAddFloors()) {
      showToast("You do not have access to add floors.", "warning");
      return;
    }

    const existingFloors = floorsMap[building.id] || [];

    if (!canAddMoreFloors(building.id, building.num_floors)) {
      showToast("You cannot add more floors than declared", "warning");
      return;
    }

    const floorValue = (newFloor[building.id] || "").trim();

    if (!floorValue) {
      showToast("Floor number cannot be empty", "warning");
      return;
    }

    const floorNumber = Number(floorValue);

    if (Number.isNaN(floorNumber) || floorNumber <= 0) {
      showToast("Floor number must be a valid positive number", "warning");
      return;
    }

    const alreadyExists = existingFloors.some(
      (f) => Number(f.floor_number) === floorNumber
    );

    if (alreadyExists) {
      showToast("That floor already exists in this building", "warning");
      return;
    }

    try {
      await createFloor(building.id, floorNumber);

      setNewFloor({
        ...newFloor,
        [building.id]: "",
      });

      await load();
      showToast("Floor added", "success");
    } catch (err: any) {
      console.error(err);

      if (err.message?.includes("unique_floor_per_building")) {
        showToast("That floor already exists in this building", "warning");
      } else {
        showToast("Failed to add floor", "error");
      }
    }
  }

  const filteredBuildings = useMemo(() => {
    return buildings.filter((b) => {
      const matchesSearch = b.building_name
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchesCollege = collegeFilter
        ? String(b.college_id) === collegeFilter
        : true;

      return matchesSearch && matchesCollege;
    });
  }, [buildings, search, collegeFilter]);

  const statCards = useMemo(() => {
    const cards = [
      {
        label: "Colleges",
        value: stats.colleges,
        color: "bg-upred",
      },
      {
        label: "Buildings",
        value: stats.buildings,
        color: "bg-upgreen",
      },
      {
        label: "Floors",
        value: stats.floors,
        color: "bg-upyellow",
      },
      {
        label: "Rooms",
        value: stats.rooms,
        color: "bg-upred",
      },
    ];

    if (isAdmin()) {
      cards.push(
        {
          label: "Users",
          value: stats.users,
          color: "bg-upgreen",
        },
        {
          label: "Approvals",
          value: stats.pendingUsers,
          color: "bg-upyellow/90",
        },
        {
          label: "Requests",
          value: stats.pendingServiceRequests,
          color: "bg-upred/90",
        },
        {
          label: "Compliance",
          value: stats.missingComplianceBuildings,
          color: "bg-upgreen/90",
        }
      );
    }

    return cards;
  }, [stats, role]);

  const statsGridClass = useMemo(() => {
    if (statCards.length === 1) return "md:grid-cols-1";
    if (statCards.length === 2) return "md:grid-cols-2";
    if (statCards.length === 3) return "md:grid-cols-3";
    if (statCards.length === 4) return "md:grid-cols-4";
    return "md:grid-cols-4 xl:grid-cols-8";
  }, [statCards.length]);

  return (
    <>
      <AnimatePresence>
        {showFade && (
          <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNameConfirmModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="ml-15 flex flex-col items-center gap-2 rounded-lg bg-white/90 px-10 py-6 shadow-lg backdrop-blur-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-center text-xl font-medium text-black/90">
                Save this display name?
              </p>

              <p className="text-center text-sm text-gray-600">
                {nameInput.trim()}
              </p>

              <div className="mt-2 flex gap-5">
                <button
                  type="button"
                  onClick={handleSaveFullName}
                  disabled={savingName}
                  className="rounded-lg border border-upgreen/30 px-5 py-2 text-upgreen transition hover:bg-upgreen/10 disabled:opacity-50"
                >
                  ✔
                </button>

                <button
                  type="button"
                  onClick={() => setShowNameConfirmModal(false)}
                  disabled={savingName}
                  className="rounded-lg border border-upred/30 px-5 py-2 text-upred transition hover:bg-upred/10 disabled:opacity-50"
                >
                  ✖
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModal && (
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
                {deleteModal.title}
              </p>

              <p className="max-w-sm text-center text-sm text-black/60">
                {deleteModal.message}
              </p>

              <div className="mt-2 flex gap-5">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="rounded-lg bg-upgreen px-5 py-2 text-white/90 transition hover:scale-110 disabled:opacity-50"
                >
                  ✔
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  disabled={deleting}
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
        {editingRoom && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={() => setEditingRoom(null)}
          >
            <motion.div
              className="ml-15 w-full max-w-md rounded-2xl border border-white/40 bg-white/95 p-6 shadow-xl backdrop-blur-md"
              initial={{ scale: 0.9, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="mb-5 text-center">
                <h2 className="text-2xl font-extrabold text-upred">
                  Edit Room
                </h2>

                <p className="mt-2 text-sm text-black/60">
                  Update the room number.
                </p>
              </div>

              <div className="mb-6 h-px w-full bg-black/10" />

              <label className="mb-1 block text-sm font-medium">
                Room Number
              </label>

              <input
                value={editingRoom.value}
                onChange={(e) =>
                  setEditingRoom((prev) =>
                    prev
                      ? {
                          ...prev,
                          value: e.target.value,
                        }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-upred/30 bg-white/90 p-3 transition focus:border-upred focus:outline-none"
                autoFocus
              />

              <div className="mt-8 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="rounded-xl border border-upred/30 px-5 py-2 text-sm font-medium text-upred transition hover:bg-upred/10"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleRenameRoom}
                  className="rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SidebarLayout background="white">
        <div className="min-h-screen bg-white p-6">
          {!profileLoaded && !fullName ? (
            <div className="mb-6 h-20" />
          ) : fullName ? (
            <>
              <div className="mb-4 flex w-full justify-center">
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div
                      className={`text-3xl font-extrabold leading-none ${getRoleTextClass()}`}
                    >
                      Welcome,
                    </div>
                    <div className="mt-2 text-xl leading-none text-black">
                      {fullName}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`text-5xl font-black leading-none ${getRoleTextClass()}`}
                    >
                      !
                    </div>

                    <div>
                      <div
                        className={`text-3xl font-extrabold leading-none ${getRoleTextClass()}`}
                      >
                        {getRoleLabel()}
                      </div>
                      <div className="mt-2 text-xl leading-none text-black/70">
                        Portal
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 h-px w-full bg-black/10" />
            </>
          ) : (
            <>
              <div className="mb-4 flex w-full justify-center">
                <div className="text-center">
                  <div className="text-3xl font-extrabold leading-none text-black">
                    Welcome to the{" "}
                    <span className={getRoleTextClass()}>{getRoleLabel()}</span>{" "}
                    <span className="text-black/70">Portal</span>
                  </div>

                  <p className="mt-3 text-sm text-black/60">
                    Before continuing, please enter your display name.
                  </p>

                  <div className="mt-5 flex flex-col justify-center gap-3 md:flex-row">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter display name"
                      className="w-full rounded-lg border border-upred/30 bg-white/80 p-3 md:w-96"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        if (!nameInput.trim()) {
                          showToast("Display name cannot be empty.", "warning");
                          return;
                        }

                        setShowNameConfirmModal(true);
                      }}
                      className="rounded-lg border border-upgreen/30 px-5 py-3 text-upgreen transition hover:bg-upgreen/10"
                    >
                      Enter
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-6 h-px w-full bg-black/10" />
            </>
          )}

          <div
            className={`mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 ${statsGridClass}`}
          >
            {statCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.03 }}
                className={`flex min-h-28 flex-col justify-center rounded-2xl border border-white/40 px-5 py-4 shadow-md backdrop-blur-sm ${card.color} text-white/90 transition hover:scale-105 hover:text-white hover:shadow-lg`}
              >
                <div className="text-sm font-medium">{card.label}</div>
                <div className="text-3xl font-extrabold">{card.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
              <div />

              <div className="flex justify-center">
              <div className="inline-flex overflow-hidden rounded-xl border border-black/10 bg-white/90">
                  <button
                    type="button"
                    onClick={() => setViewMode("hierarchy")}
                    className={`px-5 py-2 text-sm font-medium transition ${
                      viewMode === "hierarchy"
                        ? "bg-upred/25 text-upred"
                        : "text-upred hover:bg-upred/10"
                    }`}
                  >
                    Hierarchy View
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`px-5 py-2 text-sm font-medium transition ${
                      viewMode === "table"
                        ? "bg-upred/25 text-upred"
                        : "text-upred hover:bg-upred/10"
                    }`}
                  >
                    Table View
                  </button>
                </div>
              </div>

              <div className="flex justify-center md:justify-end">
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium transition ${
                    showFilters
                      ? "bg-upyellow/25 text-black"
                      : "text-upgreen hover:bg-upgreen/10"
                  }`}
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-5 flex w-full justify-center">
                <div className="grid w-full max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Search Building
                    </label>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Enter building name"
                      className="w-full rounded-lg border border-upred/30 bg-white/90 p-2"
                    />
                  </div>

                  <div className="relative">
                    <label className="mb-1 block text-sm font-medium">
                      Filter by College
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowCollegeDropdown((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-lg border border-upred/30 bg-white/90 p-2 text-left transition hover:border-upred/50"
                    >
                      <span>{selectedCollegeName}</span>

                      <ChevronDown
                        className={`h-5 w-5 text-black/50 transition ${
                          showCollegeDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showCollegeDropdown && (
                      <div className="absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-upred/20 bg-white shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setCollegeFilter("");
                            setShowCollegeDropdown(false);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                            !collegeFilter
                              ? "font-semibold text-upred"
                              : "text-black"
                          }`}
                        >
                          All Colleges
                          {!collegeFilter && <Check className="h-4 w-4" />}
                        </button>

                        {colleges.map((college) => {
                          const isSelected =
                            String(college.id) === collegeFilter;

                          return (
                            <button
                              key={college.id}
                              type="button"
                              onClick={() => {
                                setCollegeFilter(String(college.id));
                                setShowCollegeDropdown(false);
                              }}
                              className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                                isSelected
                                  ? "font-semibold text-upred"
                                  : "text-black"
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

                  {(search || collegeFilter) && (
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
          </div>

          {loading ? (
            <div className="text-gray-500">Loading facilities...</div>
          ) : filteredBuildings.length === 0 ? (
            <p className="flex items-center justify-center text-gray-500">
              No buildings found. Try adjusting your search or filters.
            </p>
          ) : (
            <>
              {viewMode === "table" && (
                <div className="overflow-x-auto rounded-lg border border-[#8d1b39]/20 bg-white/70 shadow-sm backdrop-blur-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#8d1b39] text-white">
                      <tr>
                        <th className="p-2 text-left">College</th>
                        <th className="p-2 text-left">Building</th>
                        <th className="p-2 text-left">Floors</th>
                        <th className="p-2 text-left">Footprint</th>
                        <th className="p-2 text-left">TFA</th>
                        <th className="p-2 text-left">Structural</th>
                        <th className="p-2 text-left">Ramp</th>
                        <th className="p-2 text-left">Elevator</th>
                        <th className="p-2 text-left">Generator</th>
                        <th className="p-2 text-left">CMR</th>
                        <th className="p-2 text-left">SMR</th>
                        <th className="p-2 text-left">Testing</th>
                        <th className="p-2 text-left">Attachment</th>
                        <th className="p-2 text-left">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredBuildings.map((b) => (
                        <tr
                          key={b.id}
                          className="border-t border-[#8d1b39]/10 hover:bg-[#8d1b39]/5"
                        >
                          <td className="p-2">{b.colleges?.name || "N/A"}</td>
                          <td className="p-2">{b.building_name}</td>
                          <td className="p-2">
                            {(floorsMap[b.id] || []).length}/{b.num_floors}
                          </td>
                          <td className="p-2">{b.footprint ?? "N/A"}</td>
                          <td className="p-2">{b.total_floor_area ?? "N/A"}</td>
                          <td className="p-2">
                            {String(b.structural_integrity)}
                          </td>
                          <td className="p-2">{String(b.ramp)}</td>
                          <td className="p-2">{String(b.elevator)}</td>
                          <td className="p-2">{String(b.generator)}</td>
                          <td className="p-2">{String(b.cmr_submission)}</td>
                          <td className="p-2">{String(b.smr_submission)}</td>
                          <td className="p-2">
                            {String(b.testing_requirements)}
                          </td>
                          <td className="p-2">{renderAttachment(b)}</td>
                          <td className="p-2">
                            {canEditBuilding() ? (
                              <div className="flex flex-wrap items-center gap-3">
                                <Link
                                  to={`/edit-building/${b.id}`}
                                  title="Edit building"
                                  className="text-upgreen transition hover:scale-110"
                                >
                                  <Pencil className="h-5 w-5" />
                                </Link>

                                {canDeleteBuilding() ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(b)}
                                    title="Delete building"
                                    className="text-upred transition hover:scale-110"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                ) : (
                                  <RestrictedNotice label="Delete admin only" />
                                )}
                              </div>
                            ) : (
                              <RestrictedNotice label="View-only access" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewMode === "hierarchy" && (
                <div className="space-y-4">
                  {filteredBuildings.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-2xl border border-[#8d1b39]/20 bg-white/70 p-5 shadow-sm backdrop-blur-md transition hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-xl font-bold text-black">
                            {b.building_name}
                          </div>

                          <div className="text-sm text-black/60">
                            {b.colleges?.name || "No College"}
                          </div>

                          <div className="mt-1 text-sm text-black/60">
                            <span className="font-medium text-black">
                              Attachment:
                            </span>{" "}
                            {renderAttachment(b)}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {canEditBuilding() ? (
                            <>
                              <Link
                                to={`/edit-building/${b.id}`}
                                title="Edit building"
                                className="text-upgreen transition hover:scale-110"
                              >
                                <Pencil className="h-5 w-5" />
                              </Link>

                              {canDeleteBuilding() ? (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(b)}
                                  title="Delete building"
                                  className="text-upred transition hover:scale-110"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              ) : (
                                <RestrictedNotice label="Delete admin only" />
                              )}
                            </>
                          ) : (
                            <RestrictedNotice label="Building editing restricted" />
                          )}
                        </div>
                      </div>

                      <div className="mt-5 overflow-x-auto rounded-xl border border-[#8d1b39]/20">
                        <table className="min-w-full text-sm">
                          <thead className="bg-[#8d1b39] text-white">
                            <tr>
                              <th className="p-3 text-left">Floor</th>
                              <th className="p-3 text-left">Rooms</th>
                              <th className="p-3 text-left">
                                {canAddRooms() ? "Add Room" : "Room Access"}
                              </th>
                              <th className="p-3 text-left">
                                {canDeleteFloorRoom() ? "Actions" : "Floor Access"}
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {(floorsMap[b.id] || []).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-3 text-black/60">
                                  No floors recorded.
                                </td>
                              </tr>
                            ) : (
                              (floorsMap[b.id] || []).map((f) => (
                                <tr
                                  key={f.id}
                                  className="border-t border-[#8d1b39]/10 hover:bg-[#8d1b39]/5"
                                >
                                  <td className="p-3 font-medium min-w-30">
                                    {editingFloor?.id === f.id ? (
                                      <div className="flex min-w-52 gap-2">
                                        <input
                                          value={editingFloor?.value ?? ""}
                                          onChange={(e) =>
                                            setEditingFloor({
                                              id: f.id,
                                              value: e.target.value,
                                            })
                                          }
                                          className="w-full rounded-lg border border-[#8d1b39]/30 bg-white/80 p-2"
                                        />

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRenameFloor(f.id, b.id)
                                          }
                                          className="rounded-lg border border-upgreen/30 px-3 py-2 text-xs text-upgreen transition hover:bg-upgreen/10"
                                        >
                                          Save
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setEditingFloor(null)}
                                          className="rounded-lg border border-upred/30 px-3 py-2 text-xs text-upred transition hover:bg-upred/10"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-5">
                                        <span>Floor {f.floor_number}</span>
                                        {canRenameFloorRoom() && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditingFloor({
                                                id: f.id,
                                                value: String(f.floor_number),
                                              })
                                            }
                                            title="Rename floor"
                                            className="text-upgreen transition hover:scale-110"
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>

                                  <td className="p-3">
                                    {(roomsMap[f.id] || []).length === 0 ? (
                                      <span className="text-black/50">
                                        No rooms
                                      </span>
                                    ) : (
                                      <div className="flex flex-wrap gap-2">
                                        {(roomsMap[f.id] || []).map((r) => (
                                          <span
                                            key={r.id}
                                            className="inline-flex items-center gap-1"
                                          >
                                            <>
                                            {canRenameFloorRoom() ? (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setEditingRoom({
                                                    id: r.id,
                                                    floorId: f.id,
                                                    value: String(r.room_number),
                                                  })
                                                }
                                                title="Edit room number"
                                                className="rounded-full border border-upgreen/30 px-3 py-1 text-xs font-medium text-upgreen transition hover:bg-upgreen/10"
                                              >
                                                Room {r.room_number}
                                              </button>
                                            ) : (
                                              <span className="rounded-full border border-[#1c5843]/30 px-3 py-1 text-xs font-medium text-black/70">
                                                Room {r.room_number}
                                              </span>
                                            )}

                                              {canDeleteFloorRoom() && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setDeleteModal({
                                                      title: "Delete room?",
                                                      message: `Are you sure you want to delete Room ${r.room_number}?`,
                                                      onConfirm: async () => {
                                                        await deleteRoom(r.id);
                                                        await load();
                                                      },
                                                    });
                                                  }}
                                                  title="Delete room"
                                                  className="ml-2 text-upred transition hover:scale-110"
                                                >
                                                  ×
                                                </button>
                                              )}
                                            </>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>

                                  <td className="p-3 w-60">
                                    {canAddRooms() ? (
                                      <div className="flex min-w-64 gap-2">
                                        <input
                                          placeholder="Room no."
                                          value={newRoom[f.id] || ""}
                                          onChange={(e) =>
                                            setNewRoom({
                                              ...newRoom,
                                              [f.id]: e.target.value,
                                            })
                                          }
                                          className="w-full rounded-lg border border-[#8d1b39]/30 bg-white/80 p-2"
                                        />

                                        <button
                                          type="button"
                                          onClick={() => handleAddRoom(f.id)}
                                          className="rounded-lg border border-upgreen/30 px-3 py-2 text-upgreen transition hover:bg-upgreen/10"
                                        >
                                          Add
                                        </button>
                                      </div>
                                    ) : (
                                      <RestrictedNotice label="Room editing restricted" />
                                    )}
                                  </td>

                                  <td className="p-3 min-w-30">
                                    {canDeleteFloorRoom() ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const floorRooms =
                                            roomsMap[f.id] || [];

                                          if (floorRooms.length > 0) {
                                            showToast(
                                              "Cannot delete floor with existing rooms",
                                              "warning"
                                            );
                                            return;
                                          }

                                          setDeleteModal({
                                            title: "Delete floor?",
                                            message: `Are you sure you want to delete Floor ${f.floor_number}?`,
                                            onConfirm: async () => {
                                              await deleteFloor(f.id);
                                              await load();
                                            },
                                          });
                                        }}
                                        title="Delete floor"
                                        className="text-upred transition hover:scale-110"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </button>
                                    ) : (
                                      <RestrictedNotice label="Admin only" />
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {canAddFloors() ? (
                        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
                          <input
                            placeholder="Floor number"
                            value={newFloor[b.id] || ""}
                            onChange={(e) =>
                              setNewFloor({
                                ...newFloor,
                                [b.id]: e.target.value,
                              })
                            }
                            className="rounded-lg border border-[#8d1b39]/30 bg-white/80 p-2 md:w-56"
                            disabled={!canAddMoreFloors(b.id, b.num_floors)}
                          />

                          <button
                            type="button"
                            onClick={() => handleAddFloor(b)}
                            disabled={!canAddMoreFloors(b.id, b.num_floors)}
                            className={`rounded-lg border px-4 py-2 transition ${
                              canAddMoreFloors(b.id, b.num_floors)
                                ? "border-upgreen/30 text-upgreen hover:bg-upgreen/10"
                                : "cursor-not-allowed border-black/20 text-black/40"
                            }`}
                          >
                            Add Floor
                          </button>

                          {!canAddMoreFloors(b.id, b.num_floors) && (
                            <span className="text-sm text-black/50">
                              Maximum number of floors reached.
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4">
                          <RestrictedNotice label="Floor creation restricted" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </SidebarLayout>
    </>
  );
}