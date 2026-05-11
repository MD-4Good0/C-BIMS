import { supabase } from "./supabaseClient";

export async function getServiceRequests() {
  const { data, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      buildings (
        id,
        building_name
      ),
      floors (
        id,
        floor_number
      ),
      rooms (
        id,
        room_number
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
  building_id: number | null;
  floor_id: number | null;
  room_id: number | null;
}) {
  const { data, error } = await supabase
    .from("service_requests")
    .insert([
      {
        ...payload,
        status: "pending",
      },
    ])
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