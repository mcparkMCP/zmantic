import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Camera, DollarSign } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: adminRecord } = await supabase
    .from("temple_admins")
    .select("temple_id")
    .eq("user_id", user!.id)
    .single();

  if (!adminRecord) return null;

  const templeId = adminRecord.temple_id;

  const [
    { count: scheduleCount },
    { count: eventCount },
    { count: photoCount },
    { data: donations },
  ] = await Promise.all([
    supabase
      .from("schedules")
      .select("*", { count: "exact", head: true })
      .eq("temple_id", templeId),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("temple_id", templeId),
    supabase
      .from("gallery_photos")
      .select("*", { count: "exact", head: true })
      .eq("temple_id", templeId),
    supabase
      .from("donations")
      .select("amount_cents")
      .eq("temple_id", templeId)
      .eq("status", "completed"),
  ]);

  const totalDonations = (donations || []).reduce((sum, d) => sum + d.amount_cents, 0);

  const stats = [
    { label: "Schedule Items", value: scheduleCount ?? 0, icon: Clock, href: "/dashboard/schedule" },
    { label: "Events", value: eventCount ?? 0, icon: CalendarDays, href: "/dashboard/events" },
    { label: "Photos", value: photoCount ?? 0, icon: Camera, href: "/dashboard/gallery" },
    {
      label: "Total Donations",
      value: `$${(totalDonations / 100).toFixed(2)}`,
      icon: DollarSign,
      href: "/dashboard/donations",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
