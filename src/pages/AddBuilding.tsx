import { useState } from "react";
import { createBuilding } from "../buildings";
import SidebarLayout from "../layouts/SidebarLayout";

export default function AddBuilding() {
    const [form, setForm] = useState({
        college_name: "",
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

        try {
            await createBuilding(form);
            alert("Building created successfully");
        } catch (err) {
            console.error(err);
            alert("Failed to create building");
        }
    }

    return (
        <SidebarLayout background="white">
            <div className="bg-white h-screen">
                <form onSubmit={handleSubmit}>
                <h1>Add Building</h1>

                <input name="college_name" placeholder="College" onChange={handleChange} />
                <input name="building_name" placeholder="Building Name" onChange={handleChange} />

                <input name="num_floors" type="number" placeholder="Floors" onChange={handleChange} />
                <input name="footprint" type="number" placeholder="Footprint" onChange={handleChange} />
                <input name="total_floor_area" type="number" placeholder="Total Floor Area" onChange={handleChange} />

                <label>
                    Renovated?
                    <input type="checkbox" name="renovated_bool" onChange={handleChange} />
                </label>

                <label>
                    Structural Integrity
                    <input type="checkbox" name="structural_integrity" onChange={handleChange} />
                </label>

                <label>
                    Ramp
                    <input type="checkbox" name="ramp" onChange={handleChange} />
                </label>

                <label>
                    Elevator
                    <input type="checkbox" name="elevator" onChange={handleChange} />
                </label>

                <input name="building_permit_date" type="date" onChange={handleChange} />
                <input name="occupancy_permit_date" type="date" onChange={handleChange} />

                <button type="submit">Save Building</button>
                </form>
            </div>
        </SidebarLayout>
    );
}