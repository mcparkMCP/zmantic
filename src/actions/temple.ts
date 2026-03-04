"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminTempleId } from "./auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const templeSchema = z.object({
  name: z.string().min(1),
  deity_names: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
});

export async function updateTemple(formData: FormData) {
  const templeId = await getAdminTempleId();
  if (!templeId) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData);
  const parsed = templeSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid data" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("temples")
    .update({
      ...parsed.data,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
    })
    .eq("id", templeId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/temple");
  const { data: temple } = await supabase
    .from("temples")
    .select("slug")
    .eq("id", templeId)
    .single();
  if (temple) revalidatePath(`/${temple.slug}`);

  return { success: true };
}
