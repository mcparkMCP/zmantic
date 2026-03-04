import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Clock,
  CalendarDays,
  Camera,
  DollarSign,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

const sidebarItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/temple", label: "Temple Info", icon: Building2 },
  { href: "/dashboard/schedule", label: "Schedule", icon: Clock },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays },
  { href: "/dashboard/gallery", label: "Gallery", icon: Camera },
  { href: "/dashboard/donations", label: "Donations", icon: DollarSign },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Get admin's temple
  const { data: adminRecord } = await supabase
    .from("temple_admins")
    .select("temple_id, role, temples(name, slug)")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-4 hidden md:block">
        <div className="mb-6">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Dashboard
          </h2>
          {adminRecord?.temples && (
            <p className="text-sm font-medium mt-1 truncate">
              {(adminRecord.temples as unknown as { name: string }).name}
            </p>
          )}
        </div>
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="mt-8 pt-4 border-t">
          <form action="/api/auth/signout" method="POST">
            <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6 md:p-8">
        {!adminRecord ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-2">No Temple Assigned</h2>
            <p className="text-muted-foreground mb-4">
              Your account is not linked to any temple yet. Please contact an
              administrator to be assigned to a temple.
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
