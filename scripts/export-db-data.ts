/**
 * Export all temple data and schedules from local Supabase to JSON seed files.
 * This makes the data portable — can be re-seeded into any Supabase instance.
 *
 * Usage: npx tsx scripts/export-db-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Export temples (paginate)
  const allTemples: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("temples")
      .select("*")
      .range(from, from + pageSize - 1)
      .order("slug");
    if (error) { console.error("Error:", error.message); break; }
    if (!data || data.length === 0) break;
    allTemples.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  // Export schedules (paginate)
  const allSchedules: any[] = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) { console.error("Error:", error.message); break; }
    if (!data || data.length === 0) break;
    allSchedules.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  fs.mkdirSync("scripts/data", { recursive: true });
  fs.writeFileSync("scripts/data/temples-full-export.json", JSON.stringify(allTemples, null, 2));
  fs.writeFileSync("scripts/data/schedules-export.json", JSON.stringify(allSchedules, null, 2));

  // Print stats
  const stats = {
    total: allTemples.length,
    has_description: allTemples.filter(t => t.description).length,
    has_cover_image: allTemples.filter(t => t.cover_image).length,
    has_phone: allTemples.filter(t => t.phone).length,
    has_email: allTemples.filter(t => t.email).length,
    has_website: allTemples.filter(t => t.website).length,
    has_coordinates: allTemples.filter(t => t.lat && t.lng).length,
    has_deity_names: allTemples.filter(t => t.deity_names).length,
    total_schedules: allSchedules.length,
  };

  console.log("\n=== FINAL DATA STATS ===");
  console.log(JSON.stringify(stats, null, 2));
  console.log(`\nExported to:`);
  console.log(`  scripts/data/temples-full-export.json (${allTemples.length} temples)`);
  console.log(`  scripts/data/schedules-export.json (${allSchedules.length} schedule rows)`);
}

main().catch(console.error);
