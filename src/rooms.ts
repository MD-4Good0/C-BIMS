import { supabase } from "./supabaseClient";

export async function getRoomsByFloor(floorId: number) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("floor_id", floorId)
    .order("room_number");

  if (error) throw error;
  return data;
}

export async function createRoom(floorId: number, roomNumber: string) {
  const { data, error } = await supabase
    .from("rooms")
    .insert([{ floor_id: floorId, room_number: roomNumber }])
    .select();

  if (error) throw error;
  return data;
}

export async function updateRoom(id: number, roomNumber: string) {
  const { data, error } = await supabase
    .from("rooms")
    .update({ room_number: roomNumber })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data;
}

export async function deleteRoom(id: number) {
  const { error } = await supabase
    .from("rooms")
    .delete()
    .eq("id", id);

  if (error) throw error;
}