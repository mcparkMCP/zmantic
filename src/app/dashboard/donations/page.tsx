"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Donation } from "@/types";

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

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
          .from("donations")
          .select("*")
          .eq("temple_id", admin.temple_id)
          .order("created_at", { ascending: false });
        setDonations(data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const totalAmount = donations
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + d.amount_cents, 0);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Donations</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Received</div>
            <div className="text-3xl font-bold">${(totalAmount / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Donations</div>
            <div className="text-3xl font-bold">{donations.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          {donations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No donations yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {new Date(d.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {d.donor_name || d.donor_email || "Anonymous"}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(d.amount_cents / 100).toFixed(2)}{" "}
                      {d.currency.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={d.status === "completed" ? "default" : "secondary"}
                      >
                        {d.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
