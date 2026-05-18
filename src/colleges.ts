import { supabase } from "./supabaseClient";

/* READ */
export async function getColleges() {
  const { data, error } = await supabase
    .from("colleges")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

/* COUNT BUILDINGS USING COLLEGE */
export async function getCollegeBuildingCount(collegeId: number) {
  const { count, error } = await supabase
    .from("buildings")
    .select("id", { count: "exact", head: true })
    .eq("college_id", collegeId);

  if (error) throw error;
  return count || 0;
}

/* CREATE */
export async function createCollege(name: string) {
  const cleanName = name.trim();

  const { error } = await supabase
    .from("colleges")
    .insert([{ name: cleanName }]);

  if (error) throw error;
}

/* UPDATE */
export async function updateCollege(id: number, name: string) {
  const cleanName = name.trim();

  const { error } = await supabase
    .from("colleges")
    .update({ name: cleanName })
    .eq("id", id);

  if (error) throw error;
}

/* DELETE */
export async function deleteCollege(id: number) {
  const { error } = await supabase
    .from("colleges")
    .delete()
    .eq("id", id);

  if (error) throw error;
}