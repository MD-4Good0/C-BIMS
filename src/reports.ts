import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

export type ReportGroup = {
  title: string;
  fields: ReportField[];
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

export const complianceReportFields: ReportField[] = [
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
  { key: "structural_integrity", label: "Structural Integrity" },
  { key: "retrofitting", label: "Retrofitting" },
  { key: "repainting", label: "Repainting" },
  { key: "ramp", label: "Ramp" },
  { key: "elevator", label: "Elevator" },
  { key: "pwd_restroom", label: "PWD Restroom" },
  { key: "gender_neutral_restroom", label: "Gender Neutral Restroom" },
  { key: "generator", label: "Generator" },
  { key: "generator_issue_date", label: "Generator Issue Date" },
  { key: "generator_expiration_date", label: "Generator Expiration Date" },
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

export const complianceReportGroups: ReportGroup[] = [
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
      { key: "structural_integrity", label: "Structural Integrity" },
      { key: "retrofitting", label: "Retrofitting" },
      { key: "repainting", label: "Repainting" },
    ],
  },
  {
    title: "Accessibility and Safety",
    fields: [
      { key: "ramp", label: "Ramp" },
      { key: "elevator", label: "Elevator" },
      { key: "pwd_restroom", label: "PWD Restroom" },
      { key: "gender_neutral_restroom", label: "Gender Neutral Restroom" },
      { key: "fdas", label: "FDAS" },
      { key: "fire_protection", label: "Fire Protection" },
      { key: "ventilation", label: "Ventilation" },
    ],
  },
  {
    title: "Equipment and Requirements",
    fields: [
      { key: "generator", label: "Generator" },
      { key: "generator_issue_date", label: "Generator Issue Date" },
      { key: "generator_expiration_date", label: "Generator Expiration Date" },
      { key: "electrical_wiring", label: "Electrical Wiring" },
      { key: "lvsg", label: "LVSG" },
      { key: "fiber_lan", label: "Fiber LAN" },
      { key: "cmr_submission", label: "CMR Submission" },
      { key: "smr_submission", label: "SMR Submission" },
      { key: "testing_requirements", label: "Testing Requirements" },
      { key: "has_attachment", label: "Has Attachment" },
      { key: "file_link", label: "File Link" },
    ],
  },
];

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

function downloadCSV(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function buildCSVContent(rows: any[], fields: ReportField[]) {
  const headers = fields.map((field) => field.label);

  const dataLines = rows.map((row) =>
    fields.map((field) => getReportValue(row, field.key))
  );

  return [
    headers.map(csvEscape).join(","),
    ...dataLines.map((line) => line.map(csvEscape).join(",")),
  ].join("\n");
}

function buildWorksheetRows(rows: any[], fields: ReportField[]) {
  return rows.map((row) => {
    const formattedRow: Record<string, any> = {};

    fields.forEach((field) => {
      formattedRow[field.label] = getReportValue(row, field.key);
    });

    return formattedRow;
  });
}

function escapeHtml(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function exportCombinedReportToCSV(
  rows: any[],
  buildingFields: ReportField[],
  complianceFields: ReportField[],
  fileBaseName: string
) {
  const buildingCsv = buildCSVContent(rows, buildingFields);
  const complianceCsv = buildCSVContent(rows, complianceFields);

  const combinedCsv = [
    "Building Data Report",
    buildingCsv,
    "",
    "",
    "Compliance Report",
    complianceCsv,
  ].join("\n");

  downloadCSV(combinedCsv, `${fileBaseName}.csv`);
}

export function exportCombinedReportToXLSX(
  rows: any[],
  buildingFields: ReportField[],
  complianceFields: ReportField[],
  fileName: string
) {
  const buildingRows = buildWorksheetRows(rows, buildingFields);
  const complianceRows = buildWorksheetRows(rows, complianceFields);

  const buildingSheet = XLSX.utils.json_to_sheet(buildingRows);
  const complianceSheet = XLSX.utils.json_to_sheet(complianceRows);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, buildingSheet, "Building Data");
  XLSX.utils.book_append_sheet(workbook, complianceSheet, "Compliance");

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportCleanReportToPDF(
  rows: any[],
  buildingFields: ReportField[],
  complianceGroups: ReportGroup[],
  fileName: string
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  function addTitle() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(141, 20, 54);
    doc.text("Building and Compliance Report", pageWidth / 2, 40, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(
      `${rows.length} result${rows.length !== 1 ? "s" : ""} found`,
      pageWidth / 2,
      58,
      { align: "center" }
    );
  }

  function getLastY(fallback: number) {
    return (doc as any).lastAutoTable?.finalY || fallback;
  }

  function ensureSpace(currentY: number, neededSpace = 90) {
    if (currentY + neededSpace > pageHeight - margin) {
      doc.addPage();
      return margin;
    }

    return currentY;
  }

  addTitle();

  let y = 90;

  rows.forEach((building, buildingIndex) => {
    if (buildingIndex > 0) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(String(building.building_name || "Unnamed Building"), margin, y);

    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(String(building.colleges?.name || "No College"), margin, y);

    y += 28;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(141, 20, 54);
    doc.text("Building Data Report", margin, y);

    y += 10;

    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 6,
        lineColor: [220, 220, 220],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          fillColor: [247, 247, 247],
          cellWidth: 190,
        },
        1: {
          cellWidth: pageWidth - margin * 2 - 190,
        },
      },
      body: buildingFields.map((field) => [
        field.label,
        getReportValue(building, field.key) || "N/A",
      ]),
      margin: {
        left: margin,
        right: margin,
      },
    });

    y = getLastY(y) + 28;

    doc.addPage();
    y = margin;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(String(building.building_name || "Unnamed Building"), margin, y);
    
    y += 16;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(String(building.colleges?.name || "No College"), margin, y);
    
    y += 28;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(0, 86, 63);
    doc.text("Compliance Report", margin, y);
    
    y += 20;

    complianceGroups.forEach((group) => {
      y = ensureSpace(y, 80);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(141, 20, 54);
      doc.text(group.title, margin, y);

      y += 8;

      autoTable(doc, {
        startY: y,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 6,
          lineColor: [220, 220, 220],
          lineWidth: 0.5,
        },
        columnStyles: {
          0: {
            fontStyle: "bold",
            fillColor: [247, 247, 247],
            cellWidth: 190,
          },
          1: {
            cellWidth: pageWidth - margin * 2 - 190,
          },
        },
        body: group.fields.map((field) => [
          field.label,
          getReportValue(building, field.key) || "N/A",
        ]),
        margin: {
          left: margin,
          right: margin,
        },
      });

      y = getLastY(y) + 20;
    });
  });

  doc.save(`${fileName}.pdf`);
}