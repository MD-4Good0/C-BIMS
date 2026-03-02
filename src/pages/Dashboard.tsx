import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SidebarLayout from "../layouts/SidebarLayout";

import { getBuildings } from "../buildings";
import { deleteBuilding } from "../buildings";

import { getFloorsByBuilding, createFloor, deleteFloor } from "../floors";
import { getRoomsByFloor, createRoom, deleteRoom } from "../rooms";

import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const location = useLocation();
  const fromLogin = location.state?.fromLogin;

  const [showFade, setShowFade] = useState(fromLogin);

  const [buildings, setBuildings] = useState<any[]>([]);
  const [floorsMap, setFloorsMap] = useState<Record<number, any[]>>({});
  const [roomsMap, setRoomsMap] = useState<Record<number, any[]>>({});

  const [role, setRole] = useState<string | null>(null);
  const [newFloor, setNewFloor] = useState<Record<number, string>>({});
  const [newRoom, setNewRoom] = useState<Record<number, string>>({});

  const [stats, setStats] = useState({
    buildings: 0,
    floors: 0,
    rooms: 0,
  });

  function isAdmin() {
    return role === "admin";
  }

  function isStaff() {
    return role === "staff";
  }

  function isChief() {
    return role === "chief";
  }

  function canManageBuildings() {
    return isAdmin();
  }

  function canManageFloors() {
    return isAdmin() || isStaff();
  }

  function canManageRooms() {
    return isAdmin() || isStaff();
  }

  function canDelete() {
    return isAdmin();
  }

  useEffect(() => {
    if (fromLogin) {
      const timer = setTimeout(() => setShowFade(false), 600); // match fade duration
      return () => clearTimeout(timer);
    }
  }, [fromLogin]);

  useEffect(() => {
    async function load() {
      const data = await getBuildings();
      setBuildings(data);
    }
    load();

    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      console.log("Profile data:", data);
      console.log("Profile error:", error);

      if (data) setRole(data.role);
    };

    getRole();
  }, []);

  async function handleDelete(id: number) {
    const buildingFloors = floorsMap[id] || [];

    if (buildingFloors.length > 0) {
      alert("Cannot delete building with existing floors");
      return;
    }

    const confirmDelete = window.confirm("Delete this building?");
    if (!confirmDelete) return;

    try {
      await deleteBuilding(id);
      await load();
    } catch (err) {
      alert("Delete failed");
    }
  }

  async function load() {
    const buildingData = await getBuildings();
    setBuildings(buildingData);

    const floorsMapping: Record<number, any[]> = {};
    const roomsMapping: Record<number, any[]> = {};

    for (const b of buildingData) {
      const floors = await getFloorsByBuilding(b.id);
      floorsMapping[b.id] = floors;

      for (const f of floors) {
        roomsMapping[f.id] = await getRoomsByFloor(f.id);
      }
    }

    setFloorsMap(floorsMapping);
    setRoomsMap(roomsMapping);

    // calculate counts AFTER floors and rooms fetched
    const floorCount = Object.values(floorsMapping).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    const roomCount = Object.values(roomsMapping).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    setStats({
      buildings: buildingData.length,
      floors: floorCount,
      rooms: roomCount,
    });
  }

  return (
    <>
      {/* Fade overlay */}
      <AnimatePresence>
        {showFade && (
          <motion.div
            className="fixed inset-0 bg-black z-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* Dashboard content */}
      <SidebarLayout background="white">
        <div className="bg-white h-screen p-6">
          <h1 className="text-2xl font-bold mb-4">
            {isAdmin() && "System Administration"}
            {isStaff() && "Operations Dashboard"}
            {isChief() && "Inventory Overview"}
          </h1>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500">Buildings</div>
              <div className="text-2xl font-bold">{stats.buildings}</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500">Floors</div>
              <div className="text-2xl font-bold">{stats.floors}</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500">Rooms</div>
              <div className="text-2xl font-bold">{stats.rooms}</div>
            </div>
          </div>

          {isChief() && (
            <p className="text-gray-500 mb-4">
              Read-only access. Contact administrator for changes.
            </p>
          )}

          {canManageBuildings() && (
            <div className="mb-6">
              <Link to="/admin/colleges" className="mr-4 underline">
                Manage Colleges
              </Link>
              <Link to="/add-building" className="underline">
                Add Building
              </Link>
            </div>
          )}

          <h1 className="text-xl font-semibold mb-3">
            Facility Structure
          </h1>

          <p className="text-sm text-gray-500 mb-4">
            Building → Floor → Room
          </p>

          {buildings.length === 0 ? (
            <p>No buildings yet</p>
          ) : (
            <ul>
              {buildings.map((b) => (
                <li key={b.id} className="mb-4 p-4 border rounded-lg">
                  <strong>Building:</strong> {b.building_name} — {b.colleges?.name || "No College"}

                  {canManageBuildings() && (
                    <>
                      {" | "}
                      <Link to={`/edit-building/${b.id}`}>Edit</Link>
                    </>
                  )}

                  {role === "admin" && (
                    <>
                      {" | "}
                      <button onClick={() => handleDelete(b.id)}>
                        Delete
                      </button>
                    </>
                  )}

                  {/* FLOORS UNDER BUILDING */}
                  <div style={{ marginLeft: "20px", marginTop: "5px" }}>
                    <strong>Floors</strong>

                    {floorsMap[b.id]?.length === 0 && <p>No floors</p>}

                    <ul>
                      {floorsMap[b.id]?.map((f) => (
                        <li key={f.id}>
                          <strong>Floor {f.floor_number}</strong>

                          {canDelete() && (
                            <>
                              {" | "}
                              <button onClick={async () => {
                                const floorRooms = roomsMap[f.id] || [];

                                if (floorRooms.length > 0) {
                                  alert("Cannot delete floor with existing rooms");
                                  return;
                                }

                                await deleteFloor(f.id);
                                await load();
                              }}>
                                Delete
                              </button>
                            </>
                          )}

                          {/* ROOMS */}
                          <div style={{ marginLeft: "20px", marginTop: "4px" }}>
                            <strong>Rooms</strong>

                            {roomsMap[f.id]?.length === 0 && <p>No rooms</p>}

                            <ul>
                              {roomsMap[f.id]?.map((r) => (
                                <li key={r.id}>
                                  Room: {r.room_number}

                                  {canDelete() && (
                                    <>
                                      {" | "}
                                      <button onClick={async () => {
                                        await deleteRoom(r.id);
                                        load();
                                      }}>
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </li>
                              ))}
                            </ul>

                            {canManageRooms() && (
                              <>
                                <input
                                  placeholder="Room number"
                                  value={newRoom[f.id] || ""}
                                  onChange={(e) =>
                                    setNewRoom({ ...newRoom, [f.id]: e.target.value })
                                  }
                                />
                                <button
                                  onClick={async () => {
                                    const roomNumber = newRoom[f.id].trim();

                                    if (!roomNumber) {
                                      alert("Room number cannot be empty");
                                      return;
                                    }

                                    try {
                                      await createRoom(f.id, roomNumber);
                                    } catch (err: any) {
                                      if (err.message.includes("unique_room_per_floor")) {
                                        alert("That room already exists on this floor");
                                      } else {
                                        alert("Failed to add room");
                                      }
                                    }

                                    setNewRoom({ ...newRoom, [f.id]: "" });
                                    await load();
                                  }}
                                >
                                  Add Room
                                </button>
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>

                    {canManageFloors() && (
                      <>
                        <input
                          placeholder="Floor number"
                          value={newFloor[b.id] || ""}
                          onChange={(e) =>
                            setNewFloor({ ...newFloor, [b.id]: e.target.value })
                          }
                        />
                        <button
                          onClick={async () => {
                            const floorNumber = Number(newFloor[b.id]);

                            if (isNaN(floorNumber) || floorNumber <= 0) {
                              alert("Floor number must be a positive number");
                              return;
                            }

                            try {
                              await createFloor(b.id, floorNumber);
                            } catch (err: any) {
                              if (err.message.includes("unique_floor_per_building")) {
                                alert("That floor already exists in this building");
                              } else {
                                alert("Failed to add floor");
                              }
                            }

                            setNewFloor({ ...newFloor, [b.id]: "" });
                            await load();
                          }}
                        >
                          Add Floor
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>      
      </SidebarLayout>
    </>
  );
}
