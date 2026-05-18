import { supabase } from "./supabaseClient";

export async function getServiceRequests() {
  const { data: requests, error: requestsError } = await supabase
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

  if (requestsError) throw requestsError;

  const submittedByIds = Array.from(
    new Set(
      (requests || [])
        .map((request) => request.submitted_by)
        .filter(Boolean)
    )
  );

  if (submittedByIds.length === 0) {
    return requests || [];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", submittedByIds);

  if (profilesError) throw profilesError;

  const profilesById = new Map(
    (profiles || []).map((profile) => [profile.id, profile])
  );

  return (requests || []).map((request) => ({
    ...request,
    profiles: profilesById.get(request.submitted_by) || null,
  }));
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