import { supabase } from "./supabaseClient";

export async function getBuildings() {
  const { data, error } = await supabase
    .from("buildings")
    .select(`
      id,
      building_name,
      num_floors,
      college_id,
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
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching buildings:", error);
    throw error;
  }

  return data;
}

/* CREATE */
export async function createBuilding(building: any) {
  const { data, error } = await supabase
    .from("buildings")
    .insert([building])
    .select();

  if (error) {
    console.error("Error creating building:", error);
    throw error;
  }

  return data;
}

/* UPDATE */
export async function updateBuilding(id: number, updates: any) {
  const { data, error } = await supabase
    .from("buildings")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating building:", error);
    throw error;
  }

  return data;
}

/* READ SINGULAR*/
export async function getBuildingById(id: number) {
  const { data, error } = await supabase
    .from("buildings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error loading building:", error);
    throw error;
  }

  return data;
}

/* DELETE */
export async function deleteBuilding(id: number) {
  const { error } = await supabase
    .from("buildings")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting building:", error);
    throw error;
  }
}