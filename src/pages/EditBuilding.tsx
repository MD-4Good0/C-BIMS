import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getBuildingById, updateBuilding } from "../buildings";
import { getColleges } from "../colleges";
import SidebarLayout from "../layouts/SidebarLayout";
import BuildingForm from "../components/BuildingForm";
import { useToast } from "../components/ToastProvider";

export default function EditBuilding() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();

  const [colleges, setColleges] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [buildingData, collegesData] = await Promise.all([
          getBuildingById(Number(id)),
          getColleges(),
        ]);

        setForm({
          ...buildingData,
          college_id: buildingData.college_id
            ? String(buildingData.college_id)
            : "",
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
      } catch (err: any) {
        console.error(err);
        showToast(err.message || "Failed to load building", "error");
      }
    }

    load();
  }, [id, showToast]);

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
      showToast("College is required", "warning");
      return;
    }

    if (!form.building_name.trim()) {
      showToast("Building name is required", "warning");
      return;
    }

    if (Number(form.num_floors) <= 0) {
      showToast("Number of floors must be greater than 0", "warning");
      return;
    }

    if (Number(form.footprint) <= 0) {
      showToast("Footprint must be greater than 0", "warning");
      return;
    }

    if (Number(form.total_floor_area) <= 0) {
      showToast("Total floor area must be greater than 0", "warning");
      return;
    }

    if (!form.building_permit_date) {
      showToast("Building permit date is required", "warning");
      return;
    }

    if (!form.occupancy_permit_date) {
      showToast("Occupancy permit date is required", "warning");
      return;
    }

    if (form.generator && !form.generator_issue_date) {
      showToast("Generator issue date is required when generator is checked", "warning");
      return;
    }

    if (form.generator && !form.generator_expiration_date) {
      showToast(
        "Generator expiration date is required when generator is checked",
        "warning"
      );
      return;
    }

    if (form.has_attachment && !form.file_link.trim()) {
      showToast("File link is required when attachment is checked", "warning");
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
      showToast("Building updated successfully", "success");
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Update failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!form) {
    return (
      <SidebarLayout background="white">
        <div className="min-h-screen bg-white p-6">
          <p className="text-center text-black/60">Loading building...</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout background="white">
      <div className="min-h-screen bg-white p-6">
        <BuildingForm
          title="Edit Building"
          description="Update this building record and revise its facility, compliance, and attachment details."
          submitLabel="Save Changes"
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