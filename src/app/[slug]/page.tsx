import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TempleHeader } from "@/components/temple/temple-header";
import { TempleInfoCard } from "@/components/temple/temple-info-card";
import { TempleSchedule } from "@/components/temple/temple-schedule";
import { TempleEvents } from "@/components/temple/temple-events";
import { TempleGallery } from "@/components/temple/temple-gallery";
import { TempleMap } from "@/components/temple/temple-map";
import { TempleDonateButton } from "@/components/temple/temple-donate-button";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: temple } = await supabase
    .from("temples")
    .select("name, city, country, description")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!temple) return { title: "Temple Not Found" };

  const location = [temple.city, temple.country].filter(Boolean).join(", ");
  return {
    title: temple.name,
    description:
      temple.description ||
      `${temple.name} ISKCON temple${location ? ` in ${location}` : ""}. View schedules, events, and donate online.`,
    openGraph: {
      title: temple.name,
      description:
        temple.description ||
        `${temple.name} ISKCON temple${location ? ` in ${location}` : ""}.`,
    },
  };
}

export async function generateStaticParams() {
  // Use admin client since this runs at build time (no cookies)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  const supabase = createAdminClient();
  const { data: temples } = await supabase
    .from("temples")
    .select("slug")
    .eq("is_published", true);

  return (temples || []).map((t) => ({ slug: t.slug }));
}

export default async function TemplePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: temple } = await supabase
    .from("temples")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!temple) notFound();

  const [{ data: schedules }, { data: events }, { data: photos }] =
    await Promise.all([
      supabase
        .from("schedules")
        .select("*")
        .eq("temple_id", temple.id)
        .order("sort_order"),
      supabase
        .from("events")
        .select("*")
        .eq("temple_id", temple.id)
        .gte("start_date", new Date().toISOString().split("T")[0])
        .order("start_date")
        .limit(5),
      supabase
        .from("gallery_photos")
        .select("*")
        .eq("temple_id", temple.id)
        .order("sort_order")
        .limit(9),
    ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HinduTemple",
    name: temple.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: temple.address,
      addressLocality: temple.city,
      addressRegion: temple.state,
      addressCountry: temple.country,
      postalCode: temple.postal_code,
    },
    ...(temple.phone && { telephone: temple.phone }),
    ...(temple.email && { email: temple.email }),
    ...(temple.website && { url: temple.website }),
    ...(temple.lat &&
      temple.lng && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: temple.lat,
          longitude: temple.lng,
        },
      }),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <TempleHeader temple={temple} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {temple.description && (
              <div className="prose max-w-none">
                <p>{temple.description}</p>
              </div>
            )}
            <TempleSchedule schedules={schedules || []} />
            <TempleEvents events={events || []} />
            <TempleGallery photos={photos || []} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TempleInfoCard temple={temple} />
            <TempleMap temple={temple} />
            <TempleDonateButton temple={temple} />
          </div>
        </div>
      </div>
    </div>
  );
}
