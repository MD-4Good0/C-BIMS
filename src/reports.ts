import { supabase } from "./supabaseClient";

export async function getReportBuildings(filters: {
  collegeId?: string;
  buildingName?: string;
}) {
  let query = supabase
    .from("buildings")
    .select(`
      id,
      building_name,
      num_floors,
      footprint,
      total_floor_area,
      structural_integrity,
      retrofitting,
      repainting,
      ramp,
      elevator,
      pwd_restroom,
      gender_neutral_restroom,
      generator,
      cistern,
      septic_tank,
      electrical_wiring,
      lvsg,
      fdas,
      fire_protection,
      ventilation,
      fiber_lan,
      has_attachment,
      colleges (
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
  return data;
}