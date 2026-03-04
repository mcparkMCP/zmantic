/**
 * Generate URL-safe slugs for temples.
 * Handles duplicates by appending city or country.
 *
 * Usage: npx tsx scripts/generate-slugs.ts
 */

import * as fs from "fs";
import slugify from "slugify";

interface TempleWithSlug {
  name: string;
  slug: string;
  [key: string]: any;
}

function makeSlug(name: string): string {
  return slugify(name, { lower: true, strict: true, trim: true });
}

function main() {
  const input = JSON.parse(
    fs.readFileSync("scripts/data/merged-temples.json", "utf-8")
  );

  const slugMap = new Map<string, number>();
  const result: TempleWithSlug[] = [];

  for (const temple of input) {
    let slug = makeSlug(temple.name);

    // Handle duplicates
    if (slugMap.has(slug)) {
      // Try appending city
      if (temple.city) {
        slug = makeSlug(`${temple.name} ${temple.city}`);
      }
      // Still duplicate? Append country
      if (slugMap.has(slug) && temple.country) {
        slug = makeSlug(`${temple.name} ${temple.city || ""} ${temple.country}`);
      }
      // Still? Append number
      if (slugMap.has(slug)) {
        const count = (slugMap.get(slug) || 0) + 1;
        slugMap.set(slug, count);
        slug = `${slug}-${count}`;
      }
    }

    slugMap.set(slug, (slugMap.get(slug) || 0) + 1);
    result.push({ ...temple, slug });
  }

  fs.writeFileSync(
    "scripts/data/temples-with-slugs.json",
    JSON.stringify(result, null, 2)
  );
  console.log(`Generated slugs for ${result.length} temples`);
  console.log("Saved to scripts/data/temples-with-slugs.json");

  // Show some examples
  console.log("\nSample slugs:");
  result.slice(0, 10).forEach((t) => {
    console.log(`  ${t.slug} -> ${t.name}`);
  });
}

main();
