import { supabase } from "./supabaseClient";

export async function getFloorsByBuilding(buildingId: number) {
  const { data, error } = await supabase
    .from("floors")
    .select("*")
    .eq("building_id", buildingId)
    .order("floor_number");

  if (error) throw error;
  return data;
}

export async function createFloor(buildingId: number, floorNumber: number) {
  const { data, error } = await supabase
    .from("floors")
    .insert([{ building_id: buildingId, floor_number: floorNumber }])
    .select();

  if (error) throw error;
  return data;
}

export async function updateFloor(id: number, floorNumber: number) {
  const { data, error } = await supabase
    .from("floors")
    .update({ floor_number: floorNumber })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data;
}

export async function deleteFloor(id: number) {
  const { error } = await supabase
    .from("floors")
    .delete()
    .eq("id", id);

  if (error) throw error;
}