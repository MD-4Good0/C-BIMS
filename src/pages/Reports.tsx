import { useEffect, useMemo, useState } from "react";
import SidebarLayout from "../layouts/SidebarLayout";
import { getColleges } from "../colleges";
import {
  getFieldsForReport,
  complianceReportGroups,
  getReportBuildings,
  getReportValue,
  exportReportToCSV,
  exportReportToXLSX,
} from "../reports";
import type { ReportType } from "../reports";

export default function Reports() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [reportType, setReportType] = useState<ReportType>("building");
  const [selectedFields, setSelectedFields] = useState<string[]>(
    getFieldsForReport("building").map((field) => field.key)
  );

  const [summary, setSummary] = useState({
    totalBuildings: 0,
    withElevator: 0,
    withRamp: 0,
    withoutStructuralIntegrity: 0,
    withAttachment: 0,
  });

  const [filters, setFilters] = useState({
    collegeId: "",
    buildingName: "",
  });

  const availableFields = useMemo(() => {
    return getFieldsForReport(reportType);
  }, [reportType]);

  const selectedFieldDefinitions = useMemo(() => {
    return availableFields.filter((field) => selectedFields.includes(field.key));
  }, [availableFields, selectedFields]);

  const availableFieldGroups = useMemo(() => {
    if (reportType === "compliance") {
      return complianceReportGroups;
    }
  
    return [
      {
        title: "Building Data Attributes",
        fields: availableFields,
      },
    ];
  }, [reportType, availableFields]);
  
  const selectedFieldGroups = useMemo(() => {
    return availableFieldGroups
      .map((group) => ({
        ...group,
        fields: group.fields.filter((field) => selectedFields.includes(field.key)),
      }))
      .filter((group) => group.fields.length > 0);
  }, [availableFieldGroups, selectedFields]);

  const reportFileName =
    reportType === "building" ? "building-data-report" : "compliance-report";

  useEffect(() => {
    async function loadColleges() {
      try {
        const data = await getColleges();
        setColleges(data || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load colleges");
      }
    }

    loadColleges();
  }, []);

  function handleFilterChange(e: any) {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleReportTypeChange(e: any) {
    const nextReportType = e.target.value as ReportType;

    setReportType(nextReportType);
    setSelectedFields(getFieldsForReport(nextReportType).map((field) => field.key));
    setResults([]);

    setSummary({
      totalBuildings: 0,
      withElevator: 0,
      withRamp: 0,
      withoutStructuralIntegrity: 0,
      withAttachment: 0,
    });
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
    setSelectedFields(availableFields.map((field) => field.key));
  }

  function handleClearSelectedFields() {
    setSelectedFields([]);
  }

  async function handleGenerateReport(e: any) {
    e.preventDefault();

    if (selectedFields.length === 0) {
      alert("Select at least one attribute");
      return;
    }

    try {
      setLoading(true);

      const data = await getReportBuildings(filters);
      const rows = data || [];

      setResults(rows);

      setSummary({
        totalBuildings: rows.length,
        withElevator: rows.filter((b) => b.elevator).length,
        withRamp: rows.filter((b) => b.ramp).length,
        withoutStructuralIntegrity: rows.filter((b) => !b.structural_integrity).length,
        withAttachment: rows.filter((b) => b.has_attachment).length,
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    if (results.length === 0) {
      alert("No results to export");
      return;
    }

    if (selectedFieldDefinitions.length === 0) {
      alert("Select at least one attribute");
      return;
    }

    exportReportToCSV(results, selectedFieldDefinitions, reportFileName);
  }

  function handleExportXLSX() {
    if (results.length === 0) {
      alert("No results to export");
      return;
    }

    if (selectedFieldDefinitions.length === 0) {
      alert("Select at least one attribute");
      return;
    }

    exportReportToXLSX(results, selectedFieldDefinitions, reportFileName);
  }

  function handleExportPDF() {
    if (results.length === 0) {
      alert("No results to export");
      return;
    }

    window.print();
  }

  function handleClearFilters() {
    setFilters({
      collegeId: "",
      buildingName: "",
    });

    setResults([]);

    setSummary({
      totalBuildings: 0,
      withElevator: 0,
      withRamp: 0,
      withoutStructuralIntegrity: 0,
      withAttachment: 0,
    });
  }

  const complianceSummary = useMemo(() => {
    return {
      structurallySound: results.filter((b) => b.structural_integrity).length,
      accessibleRamp: results.filter((b) => b.ramp).length,
      accessibleElevator: results.filter((b) => b.elevator).length,
      withPWDRestroom: results.filter((b) => b.pwd_restroom).length,
      withGenderNeutral: results.filter((b) => b.gender_neutral_restroom).length,
      withFDAS: results.filter((b) => b.fdas).length,
      withFireProtection: results.filter((b) => b.fire_protection).length,
      withVentilation: results.filter((b) => b.ventilation).length,
      withCMR: results.filter((b) => b.cmr_submission).length,
      withSMR: results.filter((b) => b.smr_submission).length,
      withTestingRequirements: results.filter((b) => b.testing_requirements).length,
    };
  }, [results]);

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

      <div className="bg-white min-h-screen p-6">
        <div className="no-print">
          <h1 className="text-2xl font-bold mb-4">Reports</h1>
          <p className="text-sm text-gray-500 mb-6">
            Generate building data reports and compliance summaries.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="text-sm text-gray-500">Total Buildings</div>
              <div className="text-2xl font-bold">{summary.totalBuildings}</div>
            </div>

            <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="text-sm text-gray-500">With Elevator</div>
              <div className="text-2xl font-bold">{summary.withElevator}</div>
            </div>

            <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="text-sm text-gray-500">With Ramp</div>
              <div className="text-2xl font-bold">{summary.withRamp}</div>
            </div>

            <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="text-sm text-gray-500">No Structural Integrity</div>
              <div className="text-2xl font-bold">
                {summary.withoutStructuralIntegrity}
              </div>
            </div>

            <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="text-sm text-gray-500">With Attachment</div>
              <div className="text-2xl font-bold">{summary.withAttachment}</div>
            </div>
          </div>

          <form
            onSubmit={handleGenerateReport}
            className="space-y-4 mb-8 border rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <div>
              <label className="block mb-1 font-medium">Report Type</label>
              <select
                value={reportType}
                onChange={handleReportTypeChange}
                className="border p-2 rounded w-full"
              >
                <option value="building">Building Data Report</option>
                <option value="compliance">Compliance Overview Report</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">College</label>
              <select
                name="collegeId"
                value={filters.collegeId}
                onChange={handleFilterChange}
                className="border p-2 rounded w-full"
              >
                <option value="">All Colleges</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Building Name</label>
              <input
                name="buildingName"
                value={filters.buildingName}
                onChange={handleFilterChange}
                placeholder="Search by building name"
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="block font-medium">Select Attributes</label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFields}
                    className="text-sm underline"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={handleClearSelectedFields}
                    className="text-sm underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-4 border rounded p-3 max-h-96 overflow-y-auto">
                {availableFieldGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="font-semibold text-sm mb-2">{group.title}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {group.fields.map((field) => (
                        <label key={field.key} className="flex items-center gap-2 text-sm">
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
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-black text-white rounded ${
                  loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {loading ? "Generating..." : "Generate Report"}
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={results.length === 0}
                className={`px-4 py-2 border rounded ${
                  results.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                Export CSV
              </button>

              <button
                type="button"
                onClick={handleExportXLSX}
                disabled={results.length === 0}
                className={`px-4 py-2 border rounded ${
                  results.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                Export XLSX
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={results.length === 0}
                className={`px-4 py-2 border rounded ${
                  results.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                Export PDF
              </button>

              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 border rounded cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </form>

          {reportType === "compliance" && results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="text-sm text-gray-500">Structurally Sound</div>
                <div className="text-2xl font-bold">
                  {complianceSummary.structurallySound}
                </div>
              </div>

              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="text-sm text-gray-500">With Ramp</div>
                <div className="text-2xl font-bold">
                  {complianceSummary.accessibleRamp}
                </div>
              </div>

              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="text-sm text-gray-500">With Elevator</div>
                <div className="text-2xl font-bold">
                  {complianceSummary.accessibleElevator}
                </div>
              </div>

              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="text-sm text-gray-500">With PWD Restroom</div>
                <div className="text-2xl font-bold">
                  {complianceSummary.withPWDRestroom}
                </div>
              </div>

              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="text-sm text-gray-500">Gender Neutral</div>
                <div className="text-2xl font-bold">
                  {complianceSummary.withGenderNeutral}
                </div>
              </div>

              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="text-sm text-gray-500">With FDAS</div>
                <div className="text-2xl font-bold">
                  {complianceSummary.withFDAS}
                </div>
              </div>

              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="text-sm text-gray-500">With Fire Protection</div>
                <div className="text-2xl font-bold">
                  {complianceSummary.withFireProtection}
                </div>
              </div>

              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="text-sm text-gray-500">With Ventilation</div>
                <div className="text-2xl font-bold">
                  {complianceSummary.withVentilation}
                </div>
              </div>

              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="text-sm text-gray-500">With CMR Submission</div>
                <div className="text-2xl font-bold">
                  {complianceSummary.withCMR}
                </div>
              </div>

              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="text-sm text-gray-500">With SMR Submission</div>
                <div className="text-2xl font-bold">
                  {complianceSummary.withSMR}
                </div>
              </div>

              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="text-sm text-gray-500">
                  With Testing Requirements
                </div>
                <div className="text-2xl font-bold">
                  {complianceSummary.withTestingRequirements}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="report-print-area">
          <h2 className="text-xl font-semibold mb-1">
            {reportType === "building"
              ? "Building Data Results"
              : "Compliance Results"}
          </h2>

          <p className="text-sm text-gray-500 mb-3">
            {results.length} result{results.length !== 1 && "s"} found
          </p>

          {results.length === 0 ? (
            <p className="text-gray-500">
              {loading
                ? "Generating report..."
                : "No results found. Try adjusting your filters."}
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((building) => (
                <div
                  key={building.id}
                  className="border rounded-lg p-4 shadow-sm hover:shadow-md transition break-inside-avoid"
                >
                  <h3 className="text-lg font-bold">{building.building_name}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {building.colleges?.name || "No College"}
                  </p>

                  {reportType === "compliance" ? (
                    <div className="space-y-4">
                      {selectedFieldGroups.map((group) => (
                        <div key={group.title}>
                          <h4 className="font-semibold text-sm mb-2">{group.title}</h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {group.fields.map((field) => (
                              <div key={field.key}>
                                {field.label}: {getReportValue(building, field.key) || "N/A"}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {selectedFieldDefinitions.map((field) => (
                        <div key={field.key}>
                          {field.label}: {getReportValue(building, field.key) || "N/A"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}