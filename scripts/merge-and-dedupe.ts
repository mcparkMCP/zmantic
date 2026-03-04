/**
 * Merge and deduplicate temple data from multiple sources.
 * Matches by normalized name + city + country.
 *
 * Usage: npx tsx scripts/merge-and-dedupe.ts
 */

import * as fs from "fs";

interface RawTemple {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  lat?: number;
  lng?: number;
  source_url?: string;
  source: string;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeKey(t: RawTemple): string {
  const name = normalize(t.name);
  const city = normalize(t.city || "");
  const country = normalize(t.country || "");
  return `${name}|${city}|${country}`;
}

function mergeTemples(existing: RawTemple, incoming: RawTemple): RawTemple {
  return {
    name: existing.name || incoming.name,
    address: existing.address || incoming.address,
    city: existing.city || incoming.city,
    state: existing.state || incoming.state,
    country: existing.country || incoming.country,
    postal_code: existing.postal_code || incoming.postal_code,
    phone: existing.phone || incoming.phone,
    email: existing.email || incoming.email,
    website: existing.website || incoming.website,
    lat: existing.lat || incoming.lat,
    lng: existing.lng || incoming.lng,
    source_url: existing.source_url || incoming.source_url,
    source: `${existing.source},${incoming.source}`,
  };
}

function main() {
  const files = [
    "scripts/data/iskcon-centres.json",
    "scripts/data/desiretree-centres.json",
  ];

  const merged = new Map<string, RawTemple>();

  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.log(`Skipping ${file} (not found)`);
      continue;
    }

    const data: RawTemple[] = JSON.parse(fs.readFileSync(file, "utf-8"));
    console.log(`Loaded ${data.length} temples from ${file}`);

    for (const temple of data) {
      if (!temple.name || temple.name.length < 3) continue;

      const key = dedupeKey(temple);
      if (merged.has(key)) {
        merged.set(key, mergeTemples(merged.get(key)!, temple));
      } else {
        merged.set(key, temple);
      }
    }
  }

  const result = Array.from(merged.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  console.log(`\nMerged result: ${result.length} unique temples`);
  fs.writeFileSync("scripts/data/merged-temples.json", JSON.stringify(result, null, 2));
  console.log("Saved to scripts/data/merged-temples.json");
}

main();
