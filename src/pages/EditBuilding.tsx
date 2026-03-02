import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBuildingById, updateBuilding } from "../buildings";
import SidebarLayout from "../layouts/SidebarLayout";

export default function EditBuilding() {
  const { id } = useParams();
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const data = await getBuildingById(Number(id));
      setForm(data);
    }
    load();
  }, [id]);

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value,
    });
  }

  async function handleSubmit(e: any) {
    e.preventDefault();

    const { id: _, created_at, updated_at, ...updates } = form;

    try {
      await updateBuilding(Number(id), updates);
      alert("Building updated successfully");
    } catch (err) {
      console.error(err);
      alert("Update failed — check console");
    }
  }

  if (!form) return <p>Loading...</p>;

  return (
    <SidebarLayout background="white">
        <div className="bg-white h-screen">
            <form onSubmit={handleSubmit}>
            <h1>Edit Building</h1>

            <input
                name="college_name"
                value={form.college_name}
                onChange={handleChange}
            />

            <input
                name="building_name"
                value={form.building_name}
                onChange={handleChange}
            />

            <input
                name="num_floors"
                type="number"
                value={form.num_floors}
                onChange={handleChange}
            />

            <button type="submit">Save Changes</button>
            </form>
        </div>      
    </SidebarLayout>
  );
}