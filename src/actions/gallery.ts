"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminTempleId } from "./auth";
import { revalidatePath } from "next/cache";

export async function addGalleryPhoto(formData: FormData) {
  const templeId = await getAdminTempleId();
  if (!templeId) return { error: "Unauthorized" };

  const file = formData.get("file") as File;
  const caption = formData.get("caption") as string;

  if (!file || file.size === 0) return { error: "No file provided" };

  const supabase = await createClient();

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop();
  const fileName = `${templeId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("gallery")
    .upload(fileName, file);

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("gallery").getPublicUrl(fileName);

  // Get max sort order
  const { data: existing } = await supabase
    .from("gallery_photos")
    .select("sort_order")
    .eq("temple_id", templeId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { error } = await supabase.from("gallery_photos").insert({
    temple_id: templeId,
    image_url: publicUrl,
    caption: caption || null,
    sort_order: nextOrder,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/gallery");
  return { success: true };
}

export async function deleteGalleryPhoto(id: string) {
  const templeId = await getAdminTempleId();
  if (!templeId) return { error: "Unauthorized" };

  const supabase = await createClient();

  // Get the photo to find its storage path
  const { data: photo } = await supabase
    .from("gallery_photos")
    .select("image_url")
    .eq("id", id)
    .eq("temple_id", templeId)
    .single();

  if (!photo) return { error: "Photo not found" };

  // Delete from storage
  const urlParts = photo.image_url.split("/gallery/");
  if (urlParts[1]) {
    await supabase.storage.from("gallery").remove([urlParts[1]]);
  }

  // Delete from DB
  const { error } = await supabase
    .from("gallery_photos")
    .delete()
    .eq("id", id)
    .eq("temple_id", templeId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/gallery");
  return { success: true };
}
