"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Schedule } from "@/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [templeId, setTempleId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
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
        .from("schedules")
        .select("*")
        .eq("temple_id", admin.temple_id)
        .order("sort_order");
      setSchedules(data || []);
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
      start_time: formData.get("start_time") as string,
      end_time: (formData.get("end_time") as string) || null,
      day_of_week: formData.get("day_of_week") === "daily" ? null : parseInt(formData.get("day_of_week") as string),
      sort_order: parseInt((formData.get("sort_order") as string) || "0"),
    };

    const supabase = createClient();
    if (editing) {
      await supabase.from("schedules").update(data).eq("id", editing.id);
    } else {
      await supabase.from("schedules").insert(data);
    }

    setDialogOpen(false);
    setEditing(null);
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this schedule entry?")) return;
    const supabase = createClient();
    await supabase.from("schedules").delete().eq("id", id);
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
        <h1 className="text-2xl font-bold">Manage Schedule</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Entry
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {schedules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No schedule entries yet. Add your daily arati and darshan times.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.title}</TableCell>
                    <TableCell>
                      {s.start_time}
                      {s.end_time && ` - ${s.end_time}`}
                    </TableCell>
                    <TableCell>
                      {s.day_of_week !== null ? DAY_NAMES[s.day_of_week] : "Daily"}
                    </TableCell>
                    <TableCell>{s.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(s);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
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
            <DialogTitle>
              {editing ? "Edit Schedule Entry" : "Add Schedule Entry"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={editing?.title || ""}
                placeholder="e.g. Mangala Arati"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  required
                  defaultValue={editing?.start_time || ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  defaultValue={editing?.end_time || ""}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="day_of_week">Day</Label>
                <Select name="day_of_week" defaultValue={editing?.day_of_week?.toString() ?? "daily"}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    {DAY_NAMES.map((day, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  defaultValue={editing?.sort_order ?? 0}
                  className="mt-1"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Update" : "Add"} Entry
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
