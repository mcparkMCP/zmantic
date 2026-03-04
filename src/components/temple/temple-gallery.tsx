"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Camera } from "lucide-react";
import type { GalleryPhoto } from "@/types";

export function TempleGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);

  if (!photos.length) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {photos
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelected(photo)}
                  className="aspect-square overflow-hidden rounded-md hover:opacity-80 transition-opacity"
                >
                  <img
                    src={photo.image_url}
                    alt={photo.caption || "Temple photo"}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selected && (
            <div>
              <img
                src={selected.image_url}
                alt={selected.caption || "Temple photo"}
                className="w-full"
              />
              {selected.caption && (
                <p className="p-4 text-sm text-muted-foreground">
                  {selected.caption}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
