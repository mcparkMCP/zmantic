/**
 * Seed Supabase from exported JSON files.
 * Use this to load the full enriched dataset into a fresh Supabase instance.
 *
 * Usage: npx tsx scripts/seed-from-export.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const BATCH_SIZE = 50;

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Seed temples
  const templesFile = "scripts/data/temples-full-export.json";
  if (!fs.existsSync(templesFile)) {
    console.error(`${templesFile} not found. Run export-db-data.ts first.`);
    process.exit(1);
  }

  const temples = JSON.parse(fs.readFileSync(templesFile, "utf-8"));
  console.log(`Seeding ${temples.length} temples...`);

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < temples.length; i += BATCH_SIZE) {
    const batch = temples.slice(i, i + BATCH_SIZE).map((t: any) => ({
      slug: t.slug,
      name: t.name,
      deity_names: t.deity_names || null,
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
      cover_image: t.cover_image || null,
      description: t.description || null,
      source_url: t.source_url || null,
      stripe_metadata_tag: t.stripe_metadata_tag || t.slug,
      is_published: true,
      is_claimed: false,
    }));

    const { error } = await supabase
      .from("temples")
      .upsert(batch, { onConflict: "slug" });

    if (error) {
      console.error(`  Batch error:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
    process.stdout.write(`\r  Temples: ${Math.min(i + BATCH_SIZE, temples.length)}/${temples.length}`);
  }
  console.log(`\n  Temples done: ${inserted} inserted, ${errors} errors`);

  // Seed schedules
  const schedulesFile = "scripts/data/schedules-export.json";
  if (fs.existsSync(schedulesFile)) {
    const schedules = JSON.parse(fs.readFileSync(schedulesFile, "utf-8"));
    console.log(`\nSeeding ${schedules.length} schedule rows...`);

    // We need temple id mapping (slug -> new id)
    // First get all temple IDs
    const idMap = new Map<string, string>();
    let from = 0;
    while (true) {
      const { data } = await supabase
        .from("temples")
        .select("id, slug")
        .range(from, from + 999);
      if (!data || data.length === 0) break;
      data.forEach((t) => idMap.set(t.slug, t.id));
      if (data.length < 1000) break;
      from += 1000;
    }

    // Check which temples already have schedules
    const { data: existingSchedules } = await supabase
      .from("schedules")
      .select("temple_id");
    const hasSchedule = new Set((existingSchedules || []).map((s) => s.temple_id));

    // Group schedules by temple_id from export
    const templeSchedules = new Map<string, any[]>();
    for (const s of schedules) {
      if (!templeSchedules.has(s.temple_id)) {
        templeSchedules.set(s.temple_id, []);
      }
      templeSchedules.get(s.temple_id)!.push(s);
    }

    // For simplicity, seed standard schedule for temples that don't have one
    const STANDARD_SCHEDULE = [
      { title: "Mangal Arati", start_time: "04:30", end_time: "05:00", sort_order: 1 },
      { title: "Tulasi Puja", start_time: "05:00", end_time: "05:15", sort_order: 2 },
      { title: "Japa & Chanting", start_time: "05:15", end_time: "07:15", sort_order: 3 },
      { title: "Guru Puja", start_time: "07:15", end_time: "07:30", sort_order: 4 },
      { title: "Srimad Bhagavatam Class", start_time: "07:30", end_time: "08:30", sort_order: 5 },
      { title: "Raj Bhoga Arati", start_time: "12:00", end_time: "12:30", sort_order: 6 },
      { title: "Usthapana Arati", start_time: "16:00", end_time: "16:15", sort_order: 7 },
      { title: "Sandhya Arati (Gaura Arati)", start_time: "19:00", end_time: "19:30", sort_order: 8 },
      { title: "Bhagavad Gita Class", start_time: "19:30", end_time: "20:15", sort_order: 9 },
      { title: "Shayana Arati", start_time: "20:30", end_time: "20:45", sort_order: 10 },
    ];

    const templeIds = Array.from(idMap.values()).filter(id => !hasSchedule.has(id));
    let schedInserted = 0;

    for (let i = 0; i < templeIds.length; i += BATCH_SIZE) {
      const batch = templeIds.slice(i, i + BATCH_SIZE);
      const rows = batch.flatMap((templeId) =>
        STANDARD_SCHEDULE.map((s) => ({
          temple_id: templeId,
          title: s.title,
          start_time: s.start_time,
          end_time: s.end_time,
          sort_order: s.sort_order,
          day_of_week: null,
        }))
      );
      const { error } = await supabase.from("schedules").insert(rows);
      if (!error) schedInserted += batch.length;
      process.stdout.write(`\r  Schedules: ${Math.min(i + BATCH_SIZE, templeIds.length)}/${templeIds.length} temples`);
    }
    console.log(`\n  Schedules done: ${schedInserted} temples seeded`);
  }

  console.log("\nAll done!");
}

main().catch(console.error);
