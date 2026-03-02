import { useState, useEffect } from "react";
import { createBuilding } from "../buildings";
import { getColleges } from "../colleges";
import SidebarLayout from "../layouts/SidebarLayout";

export default function AddBuilding() {
  const [colleges, setColleges] = useState<any[]>([]);

  const [form, setForm] = useState({
    college_id: "",
    building_name: "",
    num_floors: 0,
    footprint: 0,
    total_floor_area: 0,

    renovated_bool: false,
    structural_integrity: false,
    retrofitting: false,
    repainting: false,

    ramp: false,
    elevator: false,
    pwd_restroom: false,
    gender_neutral_restroom: false,

    building_permit_date: "",
    occupancy_permit_date: "",

    generator: false,
    cistern: false,
    septic_tank: false,
    electrical_wiring: false,
    lvsg: false,
    fdas: false,
    fire_protection: false,
    ventilation: false,
    fiber_lan: false,

    has_attachment: false,
  });

  /* LOAD COLLEGES */
  useEffect(() => {
    async function loadColleges() {
      const data = await getColleges();
      setColleges(data);
    }
    loadColleges();
  }, []);

  /* HANDLE INPUT CHANGE */
  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value,
    }));
  }

  /* SUBMIT */
  async function handleSubmit(e: any) {
    e.preventDefault();

    if (!form.college_id || !form.building_name) {
      alert("College and Building Name are required");
      return;
    }

    const payload = {
      ...form,
      college_id: Number(form.college_id),
    };

    try {
      await createBuilding(payload);

      alert("Building created successfully");

      // reset form
      setForm({
        college_id: "",
        building_name: "",
        num_floors: 0,
        footprint: 0,
        total_floor_area: 0,

        renovated_bool: false,
        structural_integrity: false,
        retrofitting: false,
        repainting: false,

        ramp: false,
        elevator: false,
        pwd_restroom: false,
        gender_neutral_restroom: false,

        building_permit_date: "",
        occupancy_permit_date: "",

        generator: false,
        cistern: false,
        septic_tank: false,
        electrical_wiring: false,
        lvsg: false,
        fdas: false,
        fire_protection: false,
        ventilation: false,
        fiber_lan: false,

        has_attachment: false,
      });

    } catch (err) {
      console.error(err);
      alert("Failed to create building");
    }
  }

  return (
    <SidebarLayout background="white">
      <div className="bg-white h-screen p-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <h1 className="text-xl font-bold">Add Building</h1>

          {/* COLLEGE */}
          <select
            name="college_id"
            value={form.college_id}
            onChange={handleChange}
          >
            <option value="">Select College</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* BASIC INFO */}
          <input
            name="building_name"
            placeholder="Building Name"
            value={form.building_name}
            onChange={handleChange}
          />

          <input
            name="num_floors"
            type="number"
            placeholder="Floors"
            value={form.num_floors}
            onChange={handleChange}
          />

          <input
            name="footprint"
            type="number"
            placeholder="Footprint"
            value={form.footprint}
            onChange={handleChange}
          />

          <input
            name="total_floor_area"
            type="number"
            placeholder="Total Floor Area"
            value={form.total_floor_area}
            onChange={handleChange}
          />

          {/* STRUCTURAL */}
          <label>
            Renovated?
            <input
              type="checkbox"
              name="renovated_bool"
              checked={form.renovated_bool}
              onChange={handleChange}
            />
          </label>

          <label>
            Structural Integrity OK
            <input
              type="checkbox"
              name="structural_integrity"
              checked={form.structural_integrity}
              onChange={handleChange}
            />
          </label>

          {/* ACCESSIBILITY */}
          <label>
            Ramp
            <input
              type="checkbox"
              name="ramp"
              checked={form.ramp}
              onChange={handleChange}
            />
          </label>

          <label>
            Elevator
            <input
              type="checkbox"
              name="elevator"
              checked={form.elevator}
              onChange={handleChange}
            />
          </label>

          {/* PERMITS */}
          <input
            name="building_permit_date"
            type="date"
            value={form.building_permit_date}
            onChange={handleChange}
          />

          <input
            name="occupancy_permit_date"
            type="date"
            value={form.occupancy_permit_date}
            onChange={handleChange}
          />

          <button type="submit" className="px-4 py-2 bg-black text-white">
            Save Building
          </button>
        </form>
      </div>
    </SidebarLayout>
  );
}