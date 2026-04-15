import { supabase } from "./supabaseClient";

export async function getServiceRequests() {
  const { data, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      profiles:submitted_by (
        id,
        full_name,
        role
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createServiceRequest(payload: {
  title: string;
  description: string;
  submitted_by: string;
}) {
  const { data, error } = await supabase
    .from("service_requests")
    .insert([payload])
    .select();

  if (error) throw error;
  return data;
}

export async function updateServiceRequestStatus(id: number, status: string) {
  const { data, error } = await supabase
    .from("service_requests")
    .update({ status })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data;
}