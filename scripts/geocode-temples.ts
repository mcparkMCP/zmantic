/**
 * Geocode temples using Nominatim (OpenStreetMap) free API.
 * Rate limited to 1 request/second per Nominatim usage policy.
 *
 * Usage: npx tsx scripts/geocode-temples.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Zmantic/1.0 (temple geocoding)";

async function geocode(
  query: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get temples without coordinates (paginate to avoid 1000 row limit)
  const allTemples: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error: err } = await supabase
      .from("temples")
      .select("id, name, address, city, state, country")
      .is("lat", null)
      .eq("is_published", true)
      .range(from, from + pageSize - 1);
    if (err || !data || data.length === 0) break;
    allTemples.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  const temples = allTemples;
  const error = temples.length === 0 ? null : null;

  if (error || !temples) {
    console.error("Failed to fetch temples:", error?.message);
    process.exit(1);
  }

  console.log(`${temples.length} temples need geocoding`);

  let found = 0;
  let notFound = 0;

  for (let i = 0; i < temples.length; i++) {
    const t = temples[i];

    // Try progressively broader queries
    const queries = [
      [t.name, t.city, t.country].filter(Boolean).join(", "),
      [t.city, t.state, t.country].filter(Boolean).join(", "),
      [t.city, t.country].filter(Boolean).join(", "),
      t.country,
    ].filter((q) => q && q.length > 2);

    let result: { lat: number; lng: number } | null = null;

    for (const query of queries) {
      result = await geocode(query);
      if (result) break;
      await sleep(1100); // Respect rate limit
    }

    if (result) {
      const { error: updateErr } = await supabase
        .from("temples")
        .update({ lat: result.lat, lng: result.lng })
        .eq("id", t.id);

      if (!updateErr) found++;
      else notFound++;
    } else {
      notFound++;
    }

    // Rate limit: 1 req/sec
    await sleep(1100);

    if ((i + 1) % 25 === 0 || i === temples.length - 1) {
      console.log(
        `  [${i + 1}/${temples.length}] Found: ${found}, Not found: ${notFound}`
      );
    }
  }

  console.log(
    `\nDone! Geocoded: ${found}, Failed: ${notFound}, Total: ${temples.length}`
  );
}

main().catch(console.error);
