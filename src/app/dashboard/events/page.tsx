"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/types";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [templeId, setTempleId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);

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
        .from("events")
        .select("*")
        .eq("temple_id", admin.temple_id)
        .order("start_date");
      setEvents(data || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      temple_id: templeId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      start_date: formData.get("start_date") as string,
      end_date: (formData.get("end_date") as string) || null,
      start_time: (formData.get("start_time") as string) || null,
      image_url: (formData.get("image_url") as string) || null,
    };

    const supabase = createClient();
    if (editing) {
      await supabase.from("events").update(data).eq("id", editing.id);
    } else {
      await supabase.from("events").insert(data);
    }

    setDialogOpen(false);
    setEditing(null);
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", id);
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
        <h1 className="text-2xl font-bold">Manage Events</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Event
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No events yet. Add upcoming festivals and programs.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((evt) => (
                  <TableRow key={evt.id}>
                    <TableCell className="font-medium">{evt.title}</TableCell>
                    <TableCell>{evt.start_date}</TableCell>
                    <TableCell>{evt.end_date || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(evt);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(evt.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Event" : "Add Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={editing?.title || ""}
                placeholder="e.g. Janmashtami Festival"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={editing?.description || ""}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  defaultValue={editing?.start_date || ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  defaultValue={editing?.end_date || ""}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Time</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  defaultValue={editing?.start_time || ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  defaultValue={editing?.image_url || ""}
                  className="mt-1"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Update" : "Add"} Event
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
