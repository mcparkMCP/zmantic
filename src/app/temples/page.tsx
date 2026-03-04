import { createClient } from "@/lib/supabase/server";
import { TempleCard } from "@/components/temple/temple-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Temples",
  description: "Browse all ISKCON temples worldwide. Find temple schedules, events, and donate online.",
};

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ q?: string; country?: string; page?: string }>;
}

const PAGE_SIZE = 24;

export default async function BrowseTemplesPage({ searchParams }: PageProps) {
  const { q, country, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const offset = (currentPage - 1) * PAGE_SIZE;

  const supabase = await createClient();

  let query = supabase
    .from("temples")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .order("name")
    .range(offset, offset + PAGE_SIZE - 1);

  if (q) {
    query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,country.ilike.%${q}%`);
  }
  if (country) {
    query = query.eq("country", country);
  }

  const { data: temples, count } = await query;

  // Get unique countries for filter
  const { data: countries } = await supabase
    .from("temples")
    .select("country")
    .eq("is_published", true)
    .not("country", "is", null)
    .order("country");

  const uniqueCountries = [...new Set((countries || []).map((c) => c.country))].filter(Boolean);
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Temples</h1>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <form className="flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search by name or city..."
              defaultValue={q}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* Country filters */}
        <div className="flex flex-wrap gap-2">
          <a href="/temples">
            <Badge variant={!country ? "default" : "outline"}>All</Badge>
          </a>
          {uniqueCountries.slice(0, 20).map((c) => (
            <a key={c} href={`/temples?country=${encodeURIComponent(c!)}`}>
              <Badge variant={country === c ? "default" : "outline"}>{c}</Badge>
            </a>
          ))}
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground mb-4">
        {count ?? 0} temple{count !== 1 ? "s" : ""} found
        {q && ` for "${q}"`}
        {country && ` in ${country}`}
      </p>

      {temples && temples.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {temples.map((temple) => (
            <TempleCard key={temple.id} temple={temple} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No temples found. Try a different search.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {currentPage > 1 && (
            <a href={`/temples?page=${currentPage - 1}${q ? `&q=${q}` : ""}${country ? `&country=${country}` : ""}`}>
              <Button variant="outline">Previous</Button>
            </a>
          )}
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <a href={`/temples?page=${currentPage + 1}${q ? `&q=${q}` : ""}${country ? `&country=${country}` : ""}`}>
              <Button variant="outline">Next</Button>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
