/**
 * Seed standard ISKCON daily schedule for all temples.
 * Most ISKCON temples follow a similar daily program.
 * Temple admins can customize later.
 *
 * Usage: npx tsx scripts/seed-schedules.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

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

const BATCH_SIZE = 50;

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all temple IDs (paginate to avoid 1000 row limit)
  const allTemples: { id: string }[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error: err } = await supabase
      .from("temples")
      .select("id")
      .eq("is_published", true)
      .range(from, from + pageSize - 1);
    if (err || !data || data.length === 0) break;
    allTemples.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  const temples = allTemples;
  const fetchErr = temples.length === 0 ? { message: "No temples found" } : null;

  if (fetchErr || !temples) {
    console.error("Failed to fetch temples:", fetchErr?.message);
    process.exit(1);
  }

  // Check which temples already have schedules
  const { data: existing } = await supabase
    .from("schedules")
    .select("temple_id");

  const hasSchedule = new Set((existing || []).map((e) => e.temple_id));
  const templeIds = temples
    .map((t) => t.id)
    .filter((id) => !hasSchedule.has(id));

  console.log(
    `${temples.length} temples total, ${templeIds.length} need schedules`
  );

  let inserted = 0;
  let errors = 0;

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

    if (error) {
      console.error(`Batch error:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }

    process.stdout.write(
      `\r  Progress: ${Math.min(i + BATCH_SIZE, templeIds.length)}/${templeIds.length} temples`
    );
  }

  console.log(
    `\n\nDone! Seeded schedules for ${inserted} temples (${inserted * STANDARD_SCHEDULE.length} rows). Errors: ${errors}`
  );
}

main().catch(console.error);
