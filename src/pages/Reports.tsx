import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import SidebarLayout from "../layouts/SidebarLayout";
import { getColleges } from "../colleges";
import { Check, ChevronDown } from "lucide-react";
import { useToast } from "../components/ToastProvider";
import {
  getFieldsForReport,
  complianceReportGroups,
  getReportBuildings,
  getReportValue,
} from "../reports";

type ReportMode = "building" | "compliance";

type ReportField = {
  key: string;
  label: string;
};

export default function Reports() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportMode, setReportMode] = useState<ReportMode>("building");

  const [selectedFields, setSelectedFields] = useState<string[]>(
    getFieldsForReport("building").map((field) => field.key)
  );

  const [showFilters, setShowFilters] = useState(false);
  const [showAttributes, setShowAttributes] = useState(false);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  const [summary, setSummary] = useState({
    totalBuildings: 0,
    withElevator: 0,
    withRamp: 0,
    missingStructuralIntegrity: 0,
    withAttachment: 0,
  });

  const [filters, setFilters] = useState({
    collegeId: "",
    buildingName: "",
  });

  const { showToast } = useToast();

  const selectedCollegeName = useMemo(() => {
    if (!filters.collegeId) return "All Colleges";

    return (
      colleges.find((college) => String(college.id) === filters.collegeId)?.name ||
      "All Colleges"
    );
  }, [colleges, filters.collegeId]);

  const buildingFields = useMemo(() => {
    return getFieldsForReport("building");
  }, []);

  const selectedBuildingFields = useMemo(() => {
    return buildingFields.filter((field) => selectedFields.includes(field.key));
  }, [buildingFields, selectedFields]);

  const complianceFields = useMemo(() => {
    const seen = new Set<string>();
    const fields: ReportField[] = [
      { key: "building_name", label: "Building Name" },
      { key: "college", label: "College" },
    ];

    complianceReportGroups.forEach((group) => {
      group.fields.forEach((field) => {
        if (!seen.has(field.key)) {
          seen.add(field.key);
          fields.push(field);
        }
      });
    });

    return fields;
  }, []);

  const statCards = useMemo(() => {
    return [
      {
        label: "Buildings",
        value: summary.totalBuildings,
        color: "bg-upred",
      },
      {
        label: "Elevator",
        value: summary.withElevator,
        color: "bg-upgreen",
      },
      {
        label: "Ramp",
        value: summary.withRamp,
        color: "bg-upyellow",
      },
      {
        label: "Missing Structural",
        value: summary.missingStructuralIntegrity,
        color: "bg-upred",
      },
      {
        label: "Attachments",
        value: summary.withAttachment,
        color: "bg-upgreen",
      },
    ];
  }, [summary]);

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

  function resetSummary() {
    setSummary({
      totalBuildings: 0,
      withElevator: 0,
      withRamp: 0,
      missingStructuralIntegrity: 0,
      withAttachment: 0,
    });
  }

  function getReportModeLabel(mode: ReportMode) {
    if (mode === "building") return "Building Data";
    return "Compliance";
  }

  function getReportModeDescription() {
    if (reportMode === "building") {
      return "Shows the selected raw building inventory fields.";
    }

    return "Shows a fixed compliance checklist/status view.";
  }

  function handleFilterChange(e: any) {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleFieldToggle(fieldKey: string) {
    setSelectedFields((prev) => {
      if (prev.includes(fieldKey)) {
        return prev.filter((key) => key !== fieldKey);
      }

      return [...prev, fieldKey];
    });
  }

  function handleSelectAllFields() {
    setSelectedFields(buildingFields.map((field) => field.key));
  }

  function handleClearSelectedFields() {
    setSelectedFields([]);
  }

  async function handleGenerateReport(e: any) {
    e.preventDefault();

    if (reportMode !== "compliance" && selectedFields.length === 0) {
      showToast("Select at least one building data attribute", "warning");
      return;
    }

    try {
      setLoading(true);
      setReportGenerated(true);

      const data = await getReportBuildings(filters);
      const rows = data || [];

      setResults(rows);

      setSummary({
        totalBuildings: rows.length,
        withElevator: rows.filter((building) => building.elevator).length,
        withRamp: rows.filter((building) => building.ramp).length,
        missingStructuralIntegrity: rows.filter(
          (building) => !building.structural_integrity
        ).length,
        withAttachment: rows.filter((building) => building.has_attachment).length,
      });

      if (rows.length === 0) {
        showToast("No buildings matched the selected filters", "info");
      } else {
        showToast(`Reports generated`, "success");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to generate report", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleClearFilters() {
    setFilters({
      collegeId: "",
      buildingName: "",
    });

    setShowCollegeDropdown(false);
    setResults([]);
    setReportGenerated(false);
    resetSummary();
  }

  function isDateLikeField(fieldKey: string) {
    return (
      fieldKey.includes("date") ||
      fieldKey.includes("issue") ||
      fieldKey.includes("expiration")
    );
  }

  function getComplianceStatusText(building: any, field: ReportField) {
    if (field.key === "building_name" || field.key === "college") {
      return String(getReportValue(building, field.key) || "N/A");
    }

    if (
      (field.key === "elevator_permit_issue" ||
        field.key === "elevator_permit_expiration") &&
      !building.elevator
    ) {
      return "Not applicable";
    }

    if (
      (field.key === "generator_issue_date" ||
        field.key === "generator_expiration_date") &&
      !building.generator
    ) {
      return "Not applicable";
    }

    const raw = building[field.key];

    if (typeof raw === "boolean") {
      return raw ? "Available" : "Missing";
    }

    const displayValue = getReportValue(building, field.key);

    if (!displayValue) {
      return isDateLikeField(field.key) ? "Missing" : "N/A";
    }

    if (isDateLikeField(field.key)) {
      return `Available (${displayValue})`;
    }

    return String(displayValue);
  }

  function getComplianceStatusClass(building: any, field: ReportField) {
    const value = getComplianceStatusText(building, field);

    if (value === "Missing") {
      return "border-upred/20 bg-upred/10 text-upred";
    }

    if (value === "Not applicable" || value === "N/A") {
      return "border-black/10 bg-black/5 text-black/60";
    }

    if (value.startsWith("Available")) {
      return "border-upgreen/20 bg-upgreen/10 text-upgreen";
    }

    return "border-black/10 bg-white text-black/70";
  }

  function renderBuildingValue(building: any, fieldKey: string) {
    if (fieldKey === "file_link") {
      const fileLink =
        typeof building.file_link === "string" ? building.file_link.trim() : "";

      if (!fileLink) return <span className="text-black/70">N/A</span>;

      return (
        <a
          href={fileLink}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-upred underline underline-offset-4"
        >
          Open file
        </a>
      );
    }

    const value = getReportValue(building, fieldKey);

    return <span className="text-black/70">{value || "N/A"}</span>;
  }

  function renderComplianceValue(building: any, field: ReportField) {
    const value = getComplianceStatusText(building, field);

    return (
      <span
        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getComplianceStatusClass(
          building,
          field
        )}`}
      >
        {value}
      </span>
    );
  }

  function csvEscape(value: any) {
    if (value === null || value === undefined) return "";
    return `"${String(value).replace(/"/g, '""')}"`;
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

  function rowsToCSV(rows: any[][]) {
    return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  }

  function getBuildingTableRows(building: any) {
    return selectedBuildingFields.map((field) => [
      field.label,
      getReportValue(building, field.key) || "N/A",
    ]);
  }

  function getComplianceTableRows(building: any, fields: ReportField[]) {
    return fields.map((field) => [
      field.label,
      getComplianceStatusText(building, field),
    ]);
  }

  function getBuildingExportRows() {
    return results.map((building) => {
      const row: Record<string, any> = {};

      selectedBuildingFields.forEach((field) => {
        row[field.label] = getReportValue(building, field.key) || "N/A";
      });

      return row;
    });
  }

  function getComplianceExportRows() {
    return results.map((building) => {
      const row: Record<string, any> = {};

      complianceFields.forEach((field) => {
        row[field.label] = getComplianceStatusText(building, field);
      });

      return row;
    });
  }

  function handleExportCSV() {
    if (results.length === 0) {
      showToast("No results to export", "warning");
      return;
    }
  
    if (reportMode === "building") {
      const header = selectedBuildingFields.map((field) => field.label);
      const body = results.map((building) =>
        selectedBuildingFields.map(
          (field) => getReportValue(building, field.key) || "N/A"
        )
      );
  
      downloadCSV(rowsToCSV([header, ...body]), "building-data-report.csv");
      return;
    }
  
    const header = complianceFields.map((field) => field.label);
    const body = results.map((building) =>
      complianceFields.map((field) => getComplianceStatusText(building, field))
    );
  
    downloadCSV(rowsToCSV([header, ...body]), "compliance-report.csv");
  }

  function handleExportXLSX() {
    if (results.length === 0) {
      showToast("No results to export", "warning");
      return;
    }
  
    const workbook = XLSX.utils.book_new();
  
    if (reportMode === "building") {
      const buildingSheet = XLSX.utils.json_to_sheet(getBuildingExportRows());
      XLSX.utils.book_append_sheet(workbook, buildingSheet, "Building Data");
      XLSX.writeFile(workbook, "building-data-report.xlsx");
      return;
    }
  
    const complianceSheet = XLSX.utils.json_to_sheet(getComplianceExportRows());
    XLSX.utils.book_append_sheet(workbook, complianceSheet, "Compliance");
    XLSX.writeFile(workbook, "compliance-report.xlsx");
  }

  function handleExportPDF() {
    if (results.length === 0) {
      showToast("No results to export", "warning");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    function getLastY(fallback: number) {
      return (doc as any).lastAutoTable?.finalY || fallback;
    }

    function ensureSpace(y: number, needed = 90) {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        return margin;
      }

      return y;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(141, 20, 54);
    doc.text(`${getReportModeLabel(reportMode)} Report`, pageWidth / 2, 42, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`${results.length} result${results.length !== 1 ? "s" : ""} found`, pageWidth / 2, 60, {
      align: "center",
    });

    let y = 90;

    results.forEach((building, index) => {
      if (index > 0) {
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

      if (reportMode === "building") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
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
            overflow: "linebreak",
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
          body: getBuildingTableRows(building),
          margin: {
            left: margin,
            right: margin,
          },
        });

        y = getLastY(y) + 26;
      }

      if (reportMode === "compliance") {
        y = ensureSpace(y, 100);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 86, 63);
        doc.text("Compliance Report", margin, y);

        y += 20;

        complianceReportGroups.forEach((group) => {
          y = ensureSpace(y, 100);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
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
              overflow: "linebreak",
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
            body: getComplianceTableRows(building, group.fields),
            margin: {
              left: margin,
              right: margin,
            },
          });

          y = getLastY(y) + 20;
        });
      }
    });

    doc.save(`${reportMode}-report.pdf`);
  }

  return (
    <SidebarLayout background="white">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }

            .report-print-area,
            .report-print-area * {
              visibility: visible;
            }

            .report-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 24px;
              background: white;
            }

            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-white p-6">
        <div className="no-print">
          <div className="mb-4 flex w-full justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold leading-none text-upred">
                Reports
              </h1>
              <p className="mt-2 text-sm text-black/60">
                Generate building inventory reports or compliance checklist reports.
              </p>
            </div>
          </div>

          <div className="mb-6 h-px w-full bg-black/10" />

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
            {statCards.map((card) => (
              <div
                key={card.label}
                className={`flex min-h-24 flex-col justify-center rounded-2xl border border-white/40 px-5 py-4 shadow-md backdrop-blur-sm ${card.color} text-white/90 transition hover:scale-105 hover:text-white hover:shadow-lg`}
              >
                <div className="text-sm font-medium">{card.label}</div>
                <div className="text-3xl font-extrabold">{card.value}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleGenerateReport} className="mb-8">
            <div className="mb-6 grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
              <div />

              <div className="flex justify-center">
                <div className="inline-flex overflow-hidden rounded-xl border border-black/10 bg-white/90">
                {(["building", "compliance"] as ReportMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setReportMode(mode)}
                    className={`px-5 py-2 text-sm font-medium transition ${
                      reportMode === mode
                        ? "bg-upgreen/10 text-upgreen"
                        : "text-black/60 hover:bg-upgreen/10 hover:text-upgreen"
                    }`}
                  >
                    {getReportModeLabel(mode)}
                  </button>
                ))}
                </div>
              </div>

              <div className="flex justify-center gap-3 lg:justify-end">
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium transition ${
                    showFilters
                      ? "bg-upgreen/10 text-upgreen"
                      : "text-upgreen hover:bg-upgreen/10"
                  }`}
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </button>

                {reportMode !== "compliance" && (
                  <button
                    type="button"
                    onClick={() => setShowAttributes((prev) => !prev)}
                    className={`rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium transition ${
                      showAttributes
                        ? "bg-upgreen/10 text-upgreen"
                        : "text-upgreen hover:bg-upgreen/10"
                    }`}
                  >
                    {showAttributes ? "Hide Attributes" : "Attributes"}
                  </button>
                )}
              </div>
            </div>

            <p className="mb-6 text-center text-sm text-black/50">
              {getReportModeDescription()}
            </p>

            {showFilters && (
              <div className="mb-6 flex w-full justify-center">
                <div className="grid w-full max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="relative">
                    <label className="mb-1 block text-sm font-medium">
                      College
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowCollegeDropdown((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-lg border border-upred/30 bg-white/90 p-2 text-left transition hover:border-upred/50"
                    >
                      <span>{selectedCollegeName}</span>

                      <ChevronDown
                        className={`h-5 w-5 text-black/50 transition ${
                          showCollegeDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showCollegeDropdown && (
                      <div className="absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-upred/20 bg-white shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              collegeId: "",
                            }));
                            setShowCollegeDropdown(false);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                            !filters.collegeId
                              ? "font-semibold text-upred"
                              : "text-black"
                          }`}
                        >
                          All Colleges
                          {!filters.collegeId && <Check className="h-4 w-4" />}
                        </button>

                        {colleges.map((college) => {
                          const isSelected =
                            String(college.id) === filters.collegeId;

                          return (
                            <button
                              key={college.id}
                              type="button"
                              onClick={() => {
                                setFilters((prev) => ({
                                  ...prev,
                                  collegeId: String(college.id),
                                }));
                                setShowCollegeDropdown(false);
                              }}
                              className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-upred/5 ${
                                isSelected
                                  ? "font-semibold text-upred"
                                  : "text-black"
                              }`}
                            >
                              {college.name}
                              {isSelected && <Check className="h-4 w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Building Name
                    </label>
                    <input
                      name="buildingName"
                      value={filters.buildingName}
                      onChange={handleFilterChange}
                      placeholder="Search by building name"
                      className="w-full rounded-lg border border-upred/30 bg-white/90 p-2"
                    />
                  </div>

                  {(filters.collegeId || filters.buildingName) && (
                    <div className="flex justify-center md:col-span-2">
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="rounded-xl border border-upred/30 px-5 py-2 text-sm font-medium text-upred transition hover:bg-upred/10"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {reportMode !== "compliance" && showAttributes && (
              <div className="mb-6 rounded-2xl border border-upred/15 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-black">
                      Building Data Attributes
                    </h2>
                    <p className="text-sm text-black/60">
                      {selectedFields.length} selected
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSelectAllFields}
                      className="rounded-xl border border-upgreen/30 px-4 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10"
                    >
                      Select All
                    </button>

                    <button
                      type="button"
                      onClick={handleClearSelectedFields}
                      className="rounded-xl border border-upred/30 px-4 py-2 text-sm font-medium text-upred transition hover:bg-upred/10"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    {buildingFields.map((field) => {
                      const active = selectedFields.includes(field.key);

                      return (
                        <button
                          key={field.key}
                          type="button"
                          onClick={() => handleFieldToggle(field.key)}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition hover:scale-[1.01] ${
                            active
                              ? "border-upgreen/30 bg-upgreen/10 text-upgreen"
                              : "border-upred/20 bg-white text-black/70 hover:bg-upred/5"
                          }`}
                        >
                          <span>{field.label}</span>

                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                              active
                                ? "border-upgreen bg-upgreen text-white"
                                : "border-black/20 bg-white text-transparent"
                            }`}
                          >
                            <Check className="h-4 w-4" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`rounded-xl border border-upgreen/30 px-6 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10 ${
                  loading ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                {loading ? "Generating..." : "Generate Report"}
              </button>

              <span className="text-sm font-medium text-black/60">
                Export as:
              </span>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={results.length === 0 || loading}
                className={`rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10 ${
                  results.length === 0 || loading
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                CSV
              </button>

              <button
                type="button"
                onClick={handleExportXLSX}
                disabled={results.length === 0 || loading}
                className={`rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10 ${
                  results.length === 0 || loading
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                XLSX
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={results.length === 0 || loading}
                className={`rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10 ${
                  results.length === 0 || loading
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                PDF
              </button>
            </div>
          </form>
        </div>

        <div className="report-print-area">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-upred">
              {getReportModeLabel(reportMode)} Report
            </h2>

            <p className="text-sm text-black/60">
              {results.length} result{results.length !== 1 && "s"} found
            </p>
          </div>

          {loading ? (
            <p className="text-gray-500">Generating report...</p>
          ) : !reportGenerated ? (
            <p className="text-gray-500">
              Generate a report to display results.
            </p>
          ) : results.length === 0 ? (
            <p className="text-gray-500">
              No results found. Try adjusting your filters.
            </p>
          ) : (
            <div className="space-y-6">
              {results.map((building) => (
                <div
                  key={building.id}
                  className="break-inside-avoid rounded-2xl border border-upred/15 bg-white/80 p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-black">
                      {building.building_name}
                    </h3>

                    <p className="text-sm text-black/60">
                      {building.colleges?.name || "No College"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    {reportMode === "building" && (
                      <div className="rounded-2xl border border-upred/15 bg-white p-4">
                        <h4 className="mb-3 text-lg font-bold text-upred">
                          Building Data Report
                        </h4>

                        <div className="grid grid-cols-1 gap-2 text-sm">
                          {selectedBuildingFields.map((field) => (
                            <div
                              key={field.key}
                              className="flex items-start justify-between gap-6 rounded-lg border border-black/10 bg-white/80 px-4 py-3"
                            >
                              <span className="shrink-0 font-bold text-black">
                                {field.label}:
                              </span>

                              <div className="min-w-0 text-right text-black/70">
                                {renderBuildingValue(building, field.key)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {reportMode === "compliance" && (
                      <div className="rounded-2xl border border-upgreen/15 bg-white p-4">
                        <h4 className="mb-3 text-lg font-bold text-upgreen">
                          Compliance Checklist
                        </h4>

                        <div className="space-y-5">
                          {complianceReportGroups.map((group) => (
                            <div key={group.title}>
                              <h5 className="mb-2 text-sm font-bold text-upred">
                                {group.title}
                              </h5>

                              <div className="grid grid-cols-1 gap-2 text-sm">
                                {group.fields.map((field) => (
                                  <div
                                    key={field.key}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white/80 px-3 py-2"
                                  >
                                    <span className="font-bold">
                                      {field.label}
                                    </span>

                                    {renderComplianceValue(building, field)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}