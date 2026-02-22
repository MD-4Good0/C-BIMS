import { supabase } from "./supabaseClient";

/* READ */
export async function getBuildings() {
  const { data, error } = await supabase
    .from("buildings")
    .select("*")
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