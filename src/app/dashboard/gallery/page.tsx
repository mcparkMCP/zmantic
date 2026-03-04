"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { GalleryPhoto } from "@/types";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [templeId, setTempleId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: admin } = await supabase
      .from("temple_admins")
      .select("temple_id")
      .eq("user_id", user.id)
      .single();

    if (admin) {
      setTempleId(admin.temple_id);
      const { data } = await supabase
        .from("gallery_photos")
        .select("*")
        .eq("temple_id", admin.temple_id)
        .order("sort_order");
      setPhotos(data || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    const caption = formData.get("caption") as string;

    if (!file || file.size === 0) {
      setUploading(false);
      return;
    }

    const supabase = createClient();

    // Upload to storage
    const ext = file.name.split(".").pop();
    const fileName = `${templeId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(fileName, file);

    if (uploadError) {
      alert(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("gallery").getPublicUrl(fileName);

    const maxOrder = photos.length > 0 ? Math.max(...photos.map((p) => p.sort_order)) + 1 : 0;

    await supabase.from("gallery_photos").insert({
      temple_id: templeId,
      image_url: publicUrl,
      caption: caption || null,
      sort_order: maxOrder,
    });

    setDialogOpen(false);
    setUploading(false);
    load();
  }

  async function handleDelete(photo: GalleryPhoto) {
    if (!confirm("Delete this photo?")) return;
    const supabase = createClient();

    // Delete from storage
    const urlParts = photo.image_url.split("/gallery/");
    if (urlParts[1]) {
      await supabase.storage.from("gallery").remove([urlParts[1]]);
    }

    await supabase.from("gallery_photos").delete().eq("id", photo.id);
    load();
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Photo Gallery</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Upload Photo
        </Button>
      </div>

      {photos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No photos yet. Upload images of your temple.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={photo.image_url}
                  alt={photo.caption || "Temple photo"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(photo)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {photo.caption && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {photo.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="file">Photo *</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept="image/*"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                name="caption"
                placeholder="Optional caption"
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Upload
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
