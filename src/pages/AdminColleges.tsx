// src/pages/AdminColleges.tsx
import { useEffect, useState } from "react";
import {
  getColleges,
  createCollege,
  updateCollege,
  deleteCollege
} from "../colleges";
import { getCurrentUserRole } from "../auth";

export default function AdminColleges() {
  const [role, setRole] = useState<string | null>(null);
  const [colleges, setColleges] = useState<any[]>([]);
  const [newCollege, setNewCollege] = useState("");

  /* LOAD ROLE */
  useEffect(() => {
    async function loadRole() {
      const r = await getCurrentUserRole();
      setRole(r);
    }
    loadRole();
  }, []);

  /* LOAD COLLEGES */
  useEffect(() => {
    if (role === "admin") {
      load();
    }
  }, [role]);

  async function load() {
    const data = await getColleges();
    setColleges(data);
  }

  /* ROLE GUARDS */
  if (!role) return <p>Loading...</p>;
  if (role !== "admin") return <p>Access denied</p>;

  async function handleCreate() {
    if (!newCollege) return;
    await createCollege(newCollege);
    setNewCollege("");
    load();
  }

  async function handleUpdate(id: number) {
    const name = prompt("New college name:");
    if (!name) return;
    await updateCollege(id, name);
    load();
  }

  async function handleDelete(id: number) {
    const confirmDelete = window.confirm("Delete this college?");
    if (!confirmDelete) return;
    await deleteCollege(id);
    load();
  }

  return (
    <div>
      <h1>Manage Colleges</h1>

      <input
        placeholder="New college name"
        value={newCollege}
        onChange={(e) => setNewCollege(e.target.value)}
      />
      <button onClick={handleCreate}>Add</button>

      <ul>
        {colleges.map((c) => (
          <li key={c.id}>
            {c.name}
            {" | "}
            <button onClick={() => handleUpdate(c.id)}>Edit</button>
            {" | "}
            <button onClick={() => handleDelete(c.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}