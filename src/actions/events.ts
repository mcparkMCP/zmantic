"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminTempleId } from "./auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  start_date: z.string().min(1),
  end_date: z.string().optional(),
  start_time: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
});

export async function addEvent(formData: FormData) {
  const templeId = await getAdminTempleId();
  if (!templeId) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData);
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid data" };

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    temple_id: templeId,
    ...parsed.data,
    end_date: parsed.data.end_date || null,
    start_time: parsed.data.start_time || null,
    image_url: parsed.data.image_url || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function updateEvent(id: string, formData: FormData) {
  const templeId = await getAdminTempleId();
  if (!templeId) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData);
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid data" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      ...parsed.data,
      end_date: parsed.data.end_date || null,
      start_time: parsed.data.start_time || null,
      image_url: parsed.data.image_url || null,
    })
    .eq("id", id)
    .eq("temple_id", templeId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function deleteEvent(id: string) {
  const templeId = await getAdminTempleId();
  if (!templeId) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("temple_id", templeId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/events");
  return { success: true };
}
