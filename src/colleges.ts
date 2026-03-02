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

/* CREATE */
export async function createCollege(name: string) {
  const { error } = await supabase
    .from("colleges")
    .insert([{ name }]);

  if (error) throw error;
}

/* UPDATE */
export async function updateCollege(id: number, name: string) {
  const { error } = await supabase
    .from("colleges")
    .update({ name })
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