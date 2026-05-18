import { useEffect, useState } from "react";
import { createBuilding } from "../buildings";
import { getColleges } from "../colleges";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "../layouts/SidebarLayout";
import BuildingForm from "../components/BuildingForm";
import { useToast } from "../components/ToastProvider";

const initialForm = {
  college_id: "",
  building_name: "",
  num_floors: "",
  footprint: "",
  total_floor_area: "",

  renovated_bool: false,
  renovated_area: "",
  ongoing_renovation: false,
  ongoing_renovation_area: "",
  future_renovation: 0,
  cost_per_sqm: "",
  proposed_dev_cost: "",

  structural_integrity: false,
  retrofitting: false,
  repainting: false,

  ramp: false,
  elevator: false,
  pwd_restroom: false,
  gender_neutral_restroom: false,

  building_permit_date: "",
  occupancy_permit_date: "",
  elevator_permit_issue: "",
  elevator_permit_expiration: "",

  generator: false,
  generator_issue_date: "",
  generator_expiration_date: "",
  cistern: false,
  septic_tank: false,
  electrical_wiring: false,
  lvsg: false,
  fdas: false,
  fire_protection: false,
  ventilation: false,
  fiber_lan: false,

  cmr_submission: false,
  smr_submission: false,
  testing_requirements: false,

  has_attachment: false,
  file_link: "",
};

export default function AddBuilding() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [colleges, setColleges] = useState<any[]>([]);
  const [form, setForm] = useState<any>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadColleges() {
      try {
        const data = await getColleges();
        setColleges(data || []);
      } catch (err) {
        console.error(err);
        showToast("Failed to load colleges", "error");
      }
    }

    loadColleges();
  }, [showToast]);

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

  function validateForm() {
    const totalFloorArea = Number(form.total_floor_area) || 0;
    const renovatedArea = form.renovated_bool ? Number(form.renovated_area) || 0 : 0;
    const ongoingArea = form.ongoing_renovation
      ? Number(form.ongoing_renovation_area) || 0
      : 0;

    if (!form.college_id) {
      showToast("College is required", "warning");
      return false;
    }

    if (!form.building_name.trim()) {
      showToast("Building name is required", "warning");
      return false;
    }

    if (Number(form.num_floors) <= 0) {
      showToast("Number of floors must be greater than 0", "warning");
      return false;
    }

    if (Number(form.footprint) <= 0) {
      showToast("Building footprint must be greater than 0", "warning");
      return false;
    }

    if (totalFloorArea <= 0) {
      showToast("Total floor area must be greater than 0", "warning");
      return false;
    }

    if (Number(form.cost_per_sqm) <= 0) {
      showToast("Cost per SQM is required and must be greater than 0", "warning");
      return false;
    }

    if (Number(form.renovated_area) < 0) {
      showToast("Renovated area cannot be negative", "warning");
      return false;
    }

    if (Number(form.ongoing_renovation_area) < 0) {
      showToast("Ongoing renovation area cannot be negative", "warning");
      return false;
    }

    if (Number(form.proposed_dev_cost) < 0) {
      showToast("Proposed development cost cannot be negative", "warning");
      return false;
    }

    if (renovatedArea + ongoingArea > totalFloorArea) {
      showToast(
        "Renovated and ongoing renovation areas cannot exceed total floor area",
        "warning"
      );
      return false;
    }

    if (!form.building_permit_date) {
      showToast("Building permit date is required", "warning");
      return false;
    }

    if (!form.occupancy_permit_date) {
      showToast("Occupancy permit date is required", "warning");
      return false;
    }

    if (form.elevator && !form.elevator_permit_issue) {
      showToast("Elevator permit issue date is required when elevator is checked", "warning");
      return false;
    }

    if (form.elevator && !form.elevator_permit_expiration) {
      showToast(
        "Elevator permit expiration date is required when elevator is checked",
        "warning"
      );
      return false;
    }

    if (form.generator && !form.generator_issue_date) {
      showToast("Generator issue date is required when generator is checked", "warning");
      return false;
    }

    if (form.generator && !form.generator_expiration_date) {
      showToast(
        "Generator expiration date is required when generator is checked",
        "warning"
      );
      return false;
    }

    if (form.has_attachment && !form.file_link.trim()) {
      showToast("File link is required when attachment is checked", "warning");
      return false;
    }

    return true;
  }

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (submitting) return;
    if (!validateForm()) return;

    const calculatedFutureRenovation = calculateFutureRenovation();

    const payload: any = {
      ...form,
      college_id: Number(form.college_id),
      num_floors: Number(form.num_floors),
      footprint: Number(form.footprint),
      total_floor_area: Number(form.total_floor_area),
      renovated_bool: Boolean(form.renovated_bool),
      renovated_area: form.renovated_bool ? Number(form.renovated_area) || null : null,
      ongoing_renovation: Boolean(form.ongoing_renovation),
      ongoing_renovation_area: form.ongoing_renovation
        ? Number(form.ongoing_renovation_area) || null
        : null,
      future_renovation: calculatedFutureRenovation,
      cost_per_sqm: Number(form.cost_per_sqm),
      proposed_dev_cost:
        form.proposed_dev_cost === "" ? null : Number(form.proposed_dev_cost),
      elevator_permit_issue: form.elevator ? form.elevator_permit_issue : null,
      elevator_permit_expiration: form.elevator
        ? form.elevator_permit_expiration
        : null,
      generator_issue_date: form.generator ? form.generator_issue_date : null,
      generator_expiration_date: form.generator
        ? form.generator_expiration_date
        : null,
      has_attachment: Boolean(form.has_attachment),
      file_link: form.has_attachment ? form.file_link.trim() : null,
    };

    try {
      setSubmitting(true);
      await createBuilding(payload);
      showToast("Building created successfully", "success");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("INSERT ERROR:", err);
      showToast(err.message || "Insert failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SidebarLayout background="white">
      <div className="min-h-screen bg-white p-6">
        <BuildingForm
          title="Add Building"
          description="Create a new building record and define its facility, compliance, and attachment details."
          submitLabel="Save Building"
          submitting={submitting}
          form={form}
          setForm={setForm}
          colleges={colleges}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard")}
          handleChange={handleChange}
          calculateFutureRenovation={calculateFutureRenovation}
        />
      </div>
    </SidebarLayout>
  );
}