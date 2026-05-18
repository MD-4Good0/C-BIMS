import { supabase } from "./supabaseClient";

export async function getCurrentUserProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getCurrentUserRole() {
  const profile = await getCurrentUserProfile();

  if (!profile) return null;
  if (profile.status !== "approved") return null;

  return profile.role ?? null;
}

export async function isCurrentUserApproved() {
  const profile = await getCurrentUserProfile();

  return Boolean(profile?.status === "approved" && profile?.role);
}

export async function isCurrentUserAdmin() {
  const role = await getCurrentUserRole();

  return role === "admin";
}