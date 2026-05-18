import { useEffect, useMemo, useState } from "react";
import SidebarLayout from "../layouts/SidebarLayout";
import { getColleges } from "../colleges";
import { Check, ChevronDown } from "lucide-react";
import { useToast } from "../components/ToastProvider";
import {
  getFieldsForReport,
  complianceReportGroups,
  complianceReportFields,
  getReportBuildings,
  getReportValue,
  exportCombinedReportToCSV,
  exportCombinedReportToXLSX,
  exportCleanReportToPDF,
} from "../reports";

export default function Reports() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

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

    if (selectedFields.length === 0) {
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
        showToast("Report generated", "success");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to generate report", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    if (results.length === 0) {
      showToast("No results to export", "warning");
      return;
    }

    exportCombinedReportToCSV(
      results,
      selectedBuildingFields,
      complianceReportFields,
      "building-and-compliance-report"
    );
  }

  function handleExportXLSX() {
    if (results.length === 0) {
      showToast("No results to export", "warning");
      return;
    }

    exportCombinedReportToXLSX(
      results,
      selectedBuildingFields,
      complianceReportFields,
      "building-and-compliance-report"
    );
  }

  function handleExportPDF() {
    if (results.length === 0) {
      showToast("No results to export", "warning");
      return;
    }

    exportCleanReportToPDF(
      results,
      selectedBuildingFields,
      complianceReportGroups,
      "building-and-compliance-report"
    );
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

  function renderPreviewValue(building: any, fieldKey: string) {
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
                Generate building data and compliance reports side by side.
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
            <div className="mb-6 grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
              <div />

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`rounded-xl bg-upred px-6 py-2 text-sm font-medium text-white transition hover:scale-105 ${
                    loading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {loading ? "Generating..." : "Generate Report"}
                </button>
              </div>

              <div className="flex justify-center gap-3 md:justify-end">
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium transition ${
                    showFilters
                      ? "bg-upgreen text-white"
                      : "text-upgreen hover:bg-upgreen/10"
                  }`}
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAttributes((prev) => !prev)}
                  className={`rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium transition ${
                    showAttributes
                      ? "bg-upgreen text-white"
                      : "text-upgreen hover:bg-upgreen/10"
                  }`}
                >
                  {showAttributes ? "Hide Attributes" : "Attributes"}
                </button>
              </div>
            </div>

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
                        className="rounded-xl border border-upgreen/30 px-5 py-2 text-sm font-medium text-upgreen transition hover:bg-upgreen/10"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showAttributes && (
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
                    {buildingFields.map((field) => (
                      <label
                        key={field.key}
                        className="flex items-center gap-2 rounded-lg border border-black/10 bg-white/80 px-3 py-2 text-sm transition hover:bg-upred/5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field.key)}
                          onChange={() => handleFieldToggle(field.key)}
                        />
                        {field.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
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
            <h2 className="text-xl font-bold text-upred">Generated Reports</h2>

            <p className="text-sm text-black/60">
              {results.length} result{results.length !== 1 && "s"} found
            </p>
          </div>

          {loading ? (
            <p className="text-gray-500">Generating report...</p>
          ) : !reportGenerated ? (
            <p className="text-gray-500">
              Generate a report to display building and compliance results.
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

                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <div className="rounded-2xl border border-upred/15 bg-white p-4">
                      <h4 className="mb-3 text-lg font-bold text-upred">
                        Building Data Report
                      </h4>

                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {selectedBuildingFields.map((field) => (
                          <div
                            key={field.key}
                            className="rounded-lg border border-black/10 bg-white/80 px-3 py-2"
                          >
                            <span className="font-bold">{field.label}:</span>{" "}
                            {renderPreviewValue(building, field.key)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-upgreen/15 bg-white p-4">
                      <h4 className="mb-3 text-lg font-bold text-upgreen">
                        Compliance Report
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
                                  className="rounded-lg border border-black/10 bg-white/80 px-3 py-2"
                                >
                                  <span className="font-bold">
                                    {field.label}:
                                  </span>{" "}
                                  {renderPreviewValue(building, field.key)}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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