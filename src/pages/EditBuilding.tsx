import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBuildingById, updateBuilding } from "../buildings";
import { getColleges } from "../colleges";
import SidebarLayout from "../layouts/SidebarLayout";

export default function EditBuilding() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [colleges, setColleges] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const [buildingData, collegesData] = await Promise.all([
        getBuildingById(Number(id)),
        getColleges(),
      ]);

      setForm({
        ...buildingData,
        college_id: buildingData.college_id ? String(buildingData.college_id) : "",
        renovated_area: buildingData.renovated_area ?? 0,
        future_renovation: buildingData.future_renovation ?? 0,
        ongoing_renovation_area: buildingData.ongoing_renovation_area ?? 0,
        cost_per_sqm: buildingData.cost_per_sqm ?? 0,
        proposed_dev_cost: buildingData.proposed_dev_cost ?? 0,
        file_link: buildingData.file_link ?? "",
        generator_issue_date: buildingData.generator_issue_date ?? "",
        generator_expiration_date: buildingData.generator_expiration_date ?? "",
        cmr_submission: buildingData.cmr_submission ?? false,
        smr_submission: buildingData.smr_submission ?? false,
        testing_requirements: buildingData.testing_requirements ?? false,
        elevator_permit_issue: buildingData.elevator_permit_issue ?? "",
        elevator_permit_expiration: buildingData.elevator_permit_expiration ?? "",
        building_permit_date: buildingData.building_permit_date ?? "",
        occupancy_permit_date: buildingData.occupancy_permit_date ?? "",
      });

      setColleges(collegesData || []);
    }

    load();
  }, [id]);

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;

    setForm((prev: any) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  }

  function calculateFutureRenovation(currentForm = form) {
    const totalFloorArea = Number(currentForm.total_floor_area) || 0;
    const renovatedArea = currentForm.renovated_bool
      ? Number(currentForm.renovated_area) || 0
      : 0;
    const ongoingArea = currentForm.ongoing_renovation
      ? Number(currentForm.ongoing_renovation_area) || 0
      : 0;

    return Math.max(totalFloorArea - (renovatedArea + ongoingArea), 0);
  }

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (submitting) return;

    if (!form.college_id) {
      alert("College is required");
      return;
    }

    if (!form.building_name.trim()) {
      alert("Building name is required");
      return;
    }

    if (Number(form.num_floors) <= 0) {
      alert("Number of floors must be greater than 0");
      return;
    }

    if (Number(form.footprint) <= 0) {
      alert("Footprint must be greater than 0");
      return;
    }

    if (Number(form.total_floor_area) <= 0) {
      alert("Total floor area must be greater than 0");
      return;
    }

    if (!form.building_permit_date) {
      alert("Building permit date is required");
      return;
    }

    if (!form.occupancy_permit_date) {
      alert("Occupancy permit date is required");
      return;
    }

    if (form.generator && !form.generator_issue_date) {
      alert("Generator issue date is required when generator is checked");
      return;
    }

    if (form.generator && !form.generator_expiration_date) {
      alert("Generator expiration date is required when generator is checked");
      return;
    }

    if (form.has_attachment && !form.file_link.trim()) {
      alert("File link is required when attachment is checked");
      return;
    }

    const calculatedFutureRenovation = calculateFutureRenovation();

    const {
      id: _ignoreId,
      created_at,
      updated_at,
      colleges,
      ...rest
    } = form;

    const payload: any = {
      ...rest,
      college_id: Number(form.college_id),

      renovated_area: form.renovated_bool ? Number(form.renovated_area) || null : null,
      ongoing_renovation: Boolean(form.ongoing_renovation),
      ongoing_renovation_area: form.ongoing_renovation
        ? Number(form.ongoing_renovation_area) || null
        : null,
      future_renovation: calculatedFutureRenovation,
      cost_per_sqm: Number(form.cost_per_sqm) || null,
      proposed_dev_cost: Number(form.proposed_dev_cost) || null,

      elevator_permit_issue: form.elevator_permit_issue || null,
      elevator_permit_expiration: form.elevator_permit_expiration || null,
      generator_issue_date: form.generator_issue_date || null,
      generator_expiration_date: form.generator_expiration_date || null,
      file_link: form.file_link.trim() || null,
    };

    if (!form.elevator) {
      payload.elevator_permit_issue = null;
      payload.elevator_permit_expiration = null;
    }

    if (!form.generator) {
      payload.generator_issue_date = null;
      payload.generator_expiration_date = null;
    }

    if (!form.has_attachment) {
      payload.file_link = null;
    }

    if (!form.renovated_bool) {
      payload.renovated_area = null;
    }

    try {
      setSubmitting(true);
      await updateBuilding(Number(id), payload);
      alert("Building updated successfully");
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!form) {
    return <p>Loading...</p>;
  }

  return (
    <SidebarLayout background="white">
      <div className="bg-white min-h-screen p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h1 className="text-2xl font-bold">Edit Building</h1>
          <p className="text-sm text-gray-500">
            Fields marked with <span className="text-red-500">*</span> are required.
          </p>

          <div>
            <h2 className="text-lg font-semibold mb-2">Basic Information</h2>

            <div className="space-y-3">
              <div>
                <label className="block mb-1 font-medium">
                  College <span className="text-red-500">*</span>
                </label>
                <select
                  name="college_id"
                  value={form.college_id}
                  onChange={handleChange}
                  required
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select College</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Building Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="building_name"
                  value={form.building_name}
                  onChange={handleChange}
                  required
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Number of Floors <span className="text-red-500">*</span>
                </label>
                <input
                  name="num_floors"
                  type="number"
                  value={form.num_floors}
                  onChange={handleChange}
                  required
                  min={1}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Building Footprint <span className="text-red-500">*</span>
                </label>
                <input
                  name="footprint"
                  type="number"
                  value={form.footprint}
                  onChange={handleChange}
                  required
                  min={1}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Total Floor Area <span className="text-red-500">*</span>
                </label>
                <input
                  name="total_floor_area"
                  type="number"
                  value={form.total_floor_area}
                  onChange={handleChange}
                  required
                  min={1}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Renovation and Cost</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="renovated_bool"
                  checked={form.renovated_bool}
                  onChange={handleChange}
                />
                Renovated?
              </label>

              <div>
                <label className="block mb-1 font-medium">
                  Renovated Area
                </label>
                <input
                  name="renovated_area"
                  type="number"
                  value={form.renovated_area}
                  onChange={handleChange}
                  disabled={!form.renovated_bool}
                  className={`border p-2 rounded w-full ${
                    !form.renovated_bool ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="ongoing_renovation"
                  checked={!!form.ongoing_renovation}
                  onChange={handleChange}
                />
                Ongoing Renovation
              </label>

              <div>
                <label className="block mb-1 font-medium">
                  Ongoing Renovation Area
                </label>
                <input
                  name="ongoing_renovation_area"
                  type="number"
                  value={form.ongoing_renovation_area}
                  onChange={handleChange}
                  disabled={!form.ongoing_renovation}
                  className={`border p-2 rounded w-full ${
                    !form.ongoing_renovation ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Future Renovation Area
                </label>
                <input
                  name="future_renovation"
                  type="number"
                  value={calculateFutureRenovation()}
                  readOnly
                  className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Cost per SQM</label>
                <input
                  name="cost_per_sqm"
                  type="number"
                  value={form.cost_per_sqm}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Proposed Development Cost</label>
                <input
                  name="proposed_dev_cost"
                  type="number"
                  value={form.proposed_dev_cost}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Structural and Accessibility</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="structural_integrity"
                  checked={form.structural_integrity}
                  onChange={handleChange}
                />
                Structural Integrity
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="retrofitting"
                  checked={form.retrofitting}
                  onChange={handleChange}
                />
                Retrofitting
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="repainting"
                  checked={form.repainting}
                  onChange={handleChange}
                />
                Repainting
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="ramp"
                  checked={form.ramp}
                  onChange={handleChange}
                />
                Ramp
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="elevator"
                  checked={form.elevator}
                  onChange={handleChange}
                />
                Elevator
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="pwd_restroom"
                  checked={form.pwd_restroom}
                  onChange={handleChange}
                />
                PWD Restroom
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="gender_neutral_restroom"
                  checked={form.gender_neutral_restroom}
                  onChange={handleChange}
                />
                Gender Neutral Restroom
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Permits</h2>

            <div className="space-y-3">
              <div>
                <label className="block mb-1 font-medium">
                  Building Permit Date <span className="text-red-500">*</span>
                </label>
                <input
                  name="building_permit_date"
                  type="date"
                  value={form.building_permit_date}
                  onChange={handleChange}
                  required
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Occupancy Permit Date <span className="text-red-500">*</span>
                </label>
                <input
                  name="occupancy_permit_date"
                  type="date"
                  value={form.occupancy_permit_date}
                  onChange={handleChange}
                  required
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Elevator Permit Issue Date
                </label>
                <input
                  name="elevator_permit_issue"
                  type="date"
                  value={form.elevator_permit_issue}
                  onChange={handleChange}
                  disabled={!form.elevator}
                  className={`border p-2 rounded w-full ${
                    !form.elevator ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Elevator Permit Expiration Date
                </label>
                <input
                  name="elevator_permit_expiration"
                  type="date"
                  value={form.elevator_permit_expiration}
                  onChange={handleChange}
                  disabled={!form.elevator}
                  className={`border p-2 rounded w-full ${
                    !form.elevator ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Utilities and Safety</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="generator" checked={form.generator} onChange={handleChange} />
                Generator
              </label>

              <div>
                <label className="block mb-1 font-medium">
                  Generator Issue Date
                  {form.generator && <span className="text-red-500"> *</span>}
                </label>
                <input
                  name="generator_issue_date"
                  type="date"
                  value={form.generator_issue_date}
                  onChange={handleChange}
                  required={form.generator}
                  disabled={!form.generator}
                  className={`border p-2 rounded w-full ${
                    !form.generator ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Generator Expiration Date
                  {form.generator && <span className="text-red-500"> *</span>}
                </label>
                <input
                  name="generator_expiration_date"
                  type="date"
                  value={form.generator_expiration_date}
                  onChange={handleChange}
                  required={form.generator}
                  disabled={!form.generator}
                  className={`border p-2 rounded w-full ${
                    !form.generator ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="cistern" checked={form.cistern} onChange={handleChange} />
                Cistern
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="septic_tank" checked={form.septic_tank} onChange={handleChange} />
                Septic Tank
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="electrical_wiring" checked={form.electrical_wiring} onChange={handleChange} />
                Electrical Wiring
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="lvsg" checked={form.lvsg} onChange={handleChange} />
                LVSG
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="fdas" checked={form.fdas} onChange={handleChange} />
                FDAS
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="fire_protection" checked={form.fire_protection} onChange={handleChange} />
                Fire Protection
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="ventilation" checked={form.ventilation} onChange={handleChange} />
                Ventilation
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="fiber_lan" checked={form.fiber_lan} onChange={handleChange} />
                Fiber / LAN
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Environmental Compliance</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="cmr_submission"
                  checked={!!form.cmr_submission}
                  onChange={handleChange}
                />
                CMR Submission
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="smr_submission"
                  checked={!!form.smr_submission}
                  onChange={handleChange}
                />
                SMR Submission
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="testing_requirements"
                  checked={!!form.testing_requirements}
                  onChange={handleChange}
                />
                Testing Requirements
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Attachments</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="has_attachment"
                  checked={form.has_attachment}
                  onChange={handleChange}
                />
                Has Attachment
              </label>

              <div>
                <label className="block mb-1 font-medium">
                  File Link / Path{" "}
                  {form.has_attachment && (
                    <span className="text-red-500">*</span>
                  )}
                </label>

                <input
                  name="file_link"
                  placeholder="Paste file link (Google Drive, URL, etc.)"
                  value={form.file_link}
                  onChange={handleChange}
                  required={form.has_attachment}
                  disabled={!form.has_attachment}
                  className={`border p-2 rounded w-full ${
                    !form.has_attachment ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 bg-black text-white rounded ${
              submitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </SidebarLayout>
  );
}