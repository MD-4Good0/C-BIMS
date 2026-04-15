import { useEffect, useState } from "react";
import SidebarLayout from "../layouts/SidebarLayout";
import { getColleges } from "../colleges";
import { getReportBuildings } from "../reports";

export default function Reports() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    async function loadColleges() {
      const data = await getColleges();
      setColleges(data || []);
    }
    loadColleges();
  }, []);

  function handleChange(e: any) {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleGenerateReport(e: any) {
    e.preventDefault();
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

  return (
    <SidebarLayout background="white">
      <div className="bg-white min-h-screen p-6">
        <h1 className="text-2xl font-bold mb-4">Reports</h1>
        <p className="text-sm text-gray-500 mb-6">
          Filter buildings and generate a basic inventory report.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-500">Total Buildings</div>
                <div className="text-2xl font-bold">{summary.totalBuildings}</div>
            </div>

            <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-500">With Elevator</div>
                <div className="text-2xl font-bold">{summary.withElevator}</div>
            </div>

            <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-500">With Ramp</div>
                <div className="text-2xl font-bold">{summary.withRamp}</div>
            </div>

            <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-500">Without Structural Integrity</div>
                <div className="text-2xl font-bold">{summary.withoutStructuralIntegrity}</div>
            </div>

            <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-500">With Attachment</div>
                <div className="text-2xl font-bold">{summary.withAttachment}</div>
            </div>
        </div>

        <form onSubmit={handleGenerateReport} className="space-y-4 mb-8">
          <div>
            <label className="block mb-1 font-medium">College</label>
            <select
              name="collegeId"
              value={filters.collegeId}
              onChange={handleChange}
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
              onChange={handleChange}
              placeholder="Search by building name"
              className="border p-2 rounded w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-black text-white rounded ${
              loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </form>

        <div>
          <h2 className="text-xl font-semibold mb-3">Results</h2>

          {results.length === 0 ? (
            <p className="text-gray-500">No results yet.</p>
          ) : (
            <div className="space-y-4">
              {results.map((b) => (
                <div key={b.id} className="border rounded-lg p-4">
                  <h3 className="text-lg font-bold">
                    {b.building_name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {b.colleges?.name || "No College"}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Floors: {b.num_floors}</div>
                    <div>Footprint: {b.footprint}</div>
                    <div>Total Floor Area: {b.total_floor_area}</div>
                    <div>Structural Integrity: {b.structural_integrity ? "Yes" : "No"}</div>
                    <div>Retrofitting: {b.retrofitting ? "Yes" : "No"}</div>
                    <div>Repainting: {b.repainting ? "Yes" : "No"}</div>
                    <div>Ramp: {b.ramp ? "Yes" : "No"}</div>
                    <div>Elevator: {b.elevator ? "Yes" : "No"}</div>
                    <div>PWD Restroom: {b.pwd_restroom ? "Yes" : "No"}</div>
                    <div>Gender Neutral Restroom: {b.gender_neutral_restroom ? "Yes" : "No"}</div>
                    <div>Generator: {b.generator ? "Yes" : "No"}</div>
                    <div>Cistern: {b.cistern ? "Yes" : "No"}</div>
                    <div>Septic Tank: {b.septic_tank ? "Yes" : "No"}</div>
                    <div>Electrical Wiring: {b.electrical_wiring ? "Yes" : "No"}</div>
                    <div>LVSG: {b.lvsg ? "Yes" : "No"}</div>
                    <div>FDAS: {b.fdas ? "Yes" : "No"}</div>
                    <div>Fire Protection: {b.fire_protection ? "Yes" : "No"}</div>
                    <div>Ventilation: {b.ventilation ? "Yes" : "No"}</div>
                    <div>Fiber / LAN: {b.fiber_lan ? "Yes" : "No"}</div>
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