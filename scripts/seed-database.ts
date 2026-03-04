/**
 * Seed Supabase database with scraped temple data.
 * Upserts in batches of 50 to avoid rate limits.
 *
 * Usage: npx tsx scripts/seed-database.ts
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const BATCH_SIZE = 50;

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const inputFile = "scripts/data/temples-with-slugs.json";
  if (!fs.existsSync(inputFile)) {
    console.error(`${inputFile} not found. Run the scraping pipeline first.`);
    process.exit(1);
  }

  const temples = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  console.log(`Seeding ${temples.length} temples...`);

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < temples.length; i += BATCH_SIZE) {
    const batch = temples.slice(i, i + BATCH_SIZE).map((t: any) => ({
      slug: t.slug,
      name: t.name,
      address: t.address || null,
      city: t.city || null,
      state: t.state || null,
      country: t.country || null,
      postal_code: t.postal_code || null,
      phone: t.phone || null,
      email: t.email || null,
      website: t.website || null,
      lat: t.lat || null,
      lng: t.lng || null,
      source_url: t.source_url || null,
      stripe_metadata_tag: t.slug,
      is_published: true,
      is_claimed: false,
    }));

    const { error } = await supabase
      .from("temples")
      .upsert(batch, { onConflict: "slug" });

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }

    process.stdout.write(
      `\r  Progress: ${Math.min(i + BATCH_SIZE, temples.length)}/${temples.length}`
    );
  }

  console.log(`\n\nDone! Inserted/updated: ${inserted}, Errors: ${errors}`);
}

main().catch(console.error);
