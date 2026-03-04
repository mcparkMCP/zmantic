"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Temple } from "@/types";

export default function TempleEditPage() {
  const [temple, setTemple] = useState<Temple | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
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
        const { data } = await supabase
          .from("temples")
          .select("*")
          .eq("id", admin.temple_id)
          .single();
        setTemple(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!temple) return;
    setSaving(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const updates = Object.fromEntries(formData);

    const supabase = createClient();
    const { error } = await supabase
      .from("temples")
      .update(updates)
      .eq("id", temple.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Temple info updated!");
    }
    setSaving(false);
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  if (!temple) return <p>No temple found.</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Temple Info</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div
                className={`text-sm p-3 rounded-md ${
                  message.startsWith("Error")
                    ? "bg-destructive/10 text-destructive"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {message}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Temple Name *</Label>
                <Input id="name" name="name" required defaultValue={temple.name} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="deity_names">Deity Names</Label>
                <Input
                  id="deity_names"
                  name="deity_names"
                  defaultValue={temple.deity_names || ""}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={temple.description || ""}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={temple.address || ""}
                className="mt-1"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" defaultValue={temple.city || ""} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" defaultValue={temple.state || ""} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  defaultValue={temple.country || ""}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={temple.phone || ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={temple.email || ""}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                defaultValue={temple.website || ""}
                className="mt-1"
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
