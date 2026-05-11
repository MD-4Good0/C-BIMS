import { supabase } from "./supabaseClient";

export async function getPendingUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function approveUser(id: string, role: "staff" | "chief") {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      role,
      status: "approved",
    })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data;
}

export async function rejectUser(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      status: "rejected",
    })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data;
}