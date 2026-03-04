"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminTempleId } from "./auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const scheduleSchema = z.object({
  title: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().optional(),
  day_of_week: z.coerce.number().int().min(0).max(6).optional(),
  sort_order: z.coerce.number().int().default(0),
});

export async function addSchedule(formData: FormData) {
  const templeId = await getAdminTempleId();
  if (!templeId) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData);
  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid data" };

  const supabase = await createClient();
  const { error } = await supabase.from("schedules").insert({
    temple_id: templeId,
    ...parsed.data,
    end_time: parsed.data.end_time || null,
    day_of_week: parsed.data.day_of_week ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/schedule");
  return { success: true };
}

export async function updateSchedule(id: string, formData: FormData) {
  const templeId = await getAdminTempleId();
  if (!templeId) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData);
  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid data" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("schedules")
    .update({
      ...parsed.data,
      end_time: parsed.data.end_time || null,
      day_of_week: parsed.data.day_of_week ?? null,
    })
    .eq("id", id)
    .eq("temple_id", templeId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/schedule");
  return { success: true };
}

export async function deleteSchedule(id: string) {
  const templeId = await getAdminTempleId();
  if (!templeId) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", id)
    .eq("temple_id", templeId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/schedule");
  return { success: true };
}
