import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";

export type ReportFilters = {
  collegeId?: string;
  buildingName?: string;
};

export type ReportType = "building" | "compliance";

export type ReportField = {
  key: string;
  label: string;
};

export const buildingReportFields: ReportField[] = [
  { key: "building_name", label: "Building Name" },
  { key: "college", label: "College" },
  { key: "num_floors", label: "Number of Floors" },
  { key: "footprint", label: "Footprint" },
  { key: "total_floor_area", label: "Total Floor Area" },
  { key: "renovated_bool", label: "Renovated" },
  { key: "renovated_area", label: "Renovated Area" },
  { key: "ongoing_renovation", label: "Ongoing Renovation" },
  { key: "ongoing_renovation_area", label: "Ongoing Renovation Area" },
  { key: "future_renovation", label: "Future Renovation" },
  { key: "cost_per_sqm", label: "Cost per SQM" },
  { key: "proposed_dev_cost", label: "Proposed Development Cost" },
  { key: "structural_integrity", label: "Structural Integrity" },
  { key: "retrofitting", label: "Retrofitting" },
  { key: "repainting", label: "Repainting" },
  { key: "ramp", label: "Ramp" },
  { key: "elevator", label: "Elevator" },
  { key: "pwd_restroom", label: "PWD Restroom" },
  { key: "gender_neutral_restroom", label: "Gender Neutral Restroom" },
  { key: "building_permit_date", label: "Building Permit Date" },
  { key: "occupancy_permit_date", label: "Occupancy Permit Date" },
  { key: "elevator_permit_issue", label: "Elevator Permit Issue" },
  { key: "elevator_permit_expiration", label: "Elevator Permit Expiration" },
  { key: "generator", label: "Generator" },
  { key: "generator_issue_date", label: "Generator Issue Date" },
  { key: "generator_expiration_date", label: "Generator Expiration Date" },
  { key: "cistern", label: "Cistern" },
  { key: "septic_tank", label: "Septic Tank" },
  { key: "electrical_wiring", label: "Electrical Wiring" },
  { key: "lvsg", label: "LVSG" },
  { key: "fdas", label: "FDAS" },
  { key: "fire_protection", label: "Fire Protection" },
  { key: "ventilation", label: "Ventilation" },
  { key: "fiber_lan", label: "Fiber LAN" },
  { key: "cmr_submission", label: "CMR Submission" },
  { key: "smr_submission", label: "SMR Submission" },
  { key: "testing_requirements", label: "Testing Requirements" },
  { key: "has_attachment", label: "Has Attachment" },
  { key: "file_link", label: "File Link" },
];

export type ReportFieldGroup = {
  title: string;
  fields: ReportField[];
};

export const complianceReportGroups: ReportFieldGroup[] = [
  {
    title: "Building Information",
    fields: [
      { key: "building_name", label: "Building Name" },
      { key: "college", label: "College" },
      { key: "num_floors", label: "Number of Floors" },
      { key: "footprint", label: "Footprint" },
      { key: "total_floor_area", label: "Total Floor Area" },
    ],
  },
  {
    title: "Building Conditions",
    fields: [
      { key: "renovated_bool", label: "Renovated" },
      { key: "renovated_area", label: "Renovated Area" },
      { key: "ongoing_renovation", label: "Ongoing Renovation" },
      { key: "ongoing_renovation_area", label: "Ongoing Renovation Area" },
      { key: "future_renovation", label: "Future Renovation" },
    ],
  },
  {
    title: "Projected Renovation Cost",
    fields: [
      { key: "cost_per_sqm", label: "Cost per SQM" },
      { key: "proposed_dev_cost", label: "Proposed Development Cost" },
    ],
  },
  {
    title: "Structural Requirements",
    fields: [
      { key: "structural_integrity", label: "Structural Integrity" },
      { key: "retrofitting", label: "Retrofitting" },
      { key: "repainting", label: "Repainting" },
    ],
  },
  {
    title: "PWD and Gender-Neutral Compliance",
    fields: [
      { key: "ramp", label: "Ramp" },
      { key: "elevator", label: "Elevator" },
      { key: "pwd_restroom", label: "PWD Restroom" },
      { key: "gender_neutral_restroom", label: "Gender Neutral Restroom" },
    ],
  },
  {
    title: "Permits and Dates",
    fields: [
      { key: "building_permit_date", label: "Building Permit Date" },
      { key: "occupancy_permit_date", label: "Occupancy Permit Date" },
      { key: "elevator_permit_issue", label: "Elevator Permit Issue" },
      { key: "elevator_permit_expiration", label: "Elevator Permit Expiration" },
    ],
  },
  {
    title: "Utilities",
    fields: [
      { key: "generator", label: "Generator" },
      { key: "generator_issue_date", label: "Generator Issue Date" },
      { key: "generator_expiration_date", label: "Generator Expiration Date" },
      { key: "cistern", label: "Cistern" },
      { key: "septic_tank", label: "Septic Tank" },
      { key: "electrical_wiring", label: "Electrical Wiring" },
      { key: "lvsg", label: "LVSG" },
      { key: "fdas", label: "FDAS" },
      { key: "fire_protection", label: "Fire Protection" },
      { key: "ventilation", label: "Ventilation" },
      { key: "fiber_lan", label: "Fiber LAN" },
    ],
  },
  {
    title: "Environmental Compliance",
    fields: [
      { key: "cmr_submission", label: "CMR Submission" },
      { key: "smr_submission", label: "SMR Submission" },
      { key: "testing_requirements", label: "Testing Requirements" },
    ],
  },
  {
    title: "Attachments",
    fields: [
      { key: "has_attachment", label: "Has Attachment" },
      { key: "file_link", label: "File Link" },
    ],
  },
];

export const complianceReportFields: ReportField[] = complianceReportGroups.flatMap(
  (group) => group.fields
);

export function getFieldsForReport(reportType: ReportType) {
  return reportType === "building" ? buildingReportFields : complianceReportFields;
}

export async function getReportBuildings(filters: ReportFilters) {
  let query = supabase
    .from("buildings")
    .select(`
      id,
      building_name,
      num_floors,
      footprint,
      total_floor_area,
      renovated_bool,
      renovated_area,
      ongoing_renovation,
      ongoing_renovation_area,
      future_renovation,
      cost_per_sqm,
      proposed_dev_cost,
      structural_integrity,
      retrofitting,
      repainting,
      ramp,
      elevator,
      pwd_restroom,
      gender_neutral_restroom,
      building_permit_date,
      occupancy_permit_date,
      elevator_permit_issue,
      elevator_permit_expiration,
      generator,
      generator_issue_date,
      generator_expiration_date,
      cistern,
      septic_tank,
      electrical_wiring,
      lvsg,
      fdas,
      fire_protection,
      ventilation,
      fiber_lan,
      cmr_submission,
      smr_submission,
      testing_requirements,
      has_attachment,
      file_link,
      colleges:college_id (
        id,
        name
      )
    `)
    .order("building_name");

  if (filters.collegeId) {
    query = query.eq("college_id", Number(filters.collegeId));
  }

  if (filters.buildingName) {
    query = query.ilike("building_name", `%${filters.buildingName}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export function getReportValue(row: any, key: string) {
  if (key === "college") return row.colleges?.name || "";

  const value = row[key];

  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  return value;
}

function csvEscape(value: any) {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportReportToCSV(rows: any[], fields: ReportField[], fileName: string) {
  const headers = fields.map((field) => field.label);

  const dataLines = rows.map((row) =>
    fields.map((field) => getReportValue(row, field.key))
  );

  const csvContent = [
    headers.map(csvEscape).join(","),
    ...dataLines.map((line) => line.map(csvEscape).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function exportReportToXLSX(rows: any[], fields: ReportField[], fileName: string) {
  const formattedRows = rows.map((row) => {
    const formattedRow: Record<string, any> = {};

    fields.forEach((field) => {
      formattedRow[field.label] = getReportValue(row, field.key);
    });

    return formattedRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}