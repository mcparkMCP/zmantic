/**
 * Generate descriptions and deity names for temples using Azure OpenAI.
 * Processes in batches with concurrency control.
 *
 * Usage: npx tsx scripts/generate-descriptions.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_KEY = process.env.AZURE_OPENAI_API_KEY!;
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT!;
const API_URL = `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=2025-04-01-preview`;

const CONCURRENCY = 10; // parallel requests
const BATCH_DB_SIZE = 25; // DB update batch size

interface Temple {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
}

interface AIResult {
  description: string;
  deity_names: string;
}

async function generateForTemple(temple: Temple): Promise<AIResult | null> {
  const location = [temple.city, temple.state, temple.country]
    .filter(Boolean)
    .join(", ");

  const prompt = `You are writing content for an ISKCON temple directory website. Write about this temple:

Temple: ${temple.name}
Location: ${location || temple.address || "Unknown"}
${temple.website ? `Website: ${temple.website}` : ""}

Respond in EXACTLY this JSON format, no markdown, no code fences:
{"description":"A 2-3 sentence description of this ISKCON temple. Mention its location, significance, and what visitors can expect. If you know specific facts about this temple, include them. If not, write a welcoming generic description mentioning the city/country.","deity_names":"The names of the presiding deities if known (e.g. Sri Sri Radha Shyamasundara). If unknown, leave empty string."}`;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_KEY,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 300,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text();
      // Rate limited - throw to retry
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") || "5");
        await sleep(retryAfter * 1000);
        throw new Error("rate_limited");
      }
      console.error(`\n  API error for ${temple.name}: ${res.status} ${errText}`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Parse JSON response - handle potential markdown fences
    const jsonStr = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonStr);
    return {
      description: parsed.description || "",
      deity_names: parsed.deity_names || "",
    };
  } catch (err: any) {
    if (err.message === "rate_limited") throw err;
    console.error(`\n  Error for ${temple.name}: ${err.message}`);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processWithConcurrency(
  temples: Temple[],
  concurrency: number,
  supabase: any
) {
  let completed = 0;
  let updated = 0;
  let failed = 0;
  const total = temples.length;

  // Process in chunks of `concurrency`
  for (let i = 0; i < temples.length; i += concurrency) {
    const chunk = temples.slice(i, i + concurrency);

    const results = await Promise.allSettled(
      chunk.map(async (temple) => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const result = await generateForTemple(temple);
            return { temple, result };
          } catch (err: any) {
            if (err.message === "rate_limited" && attempt < 2) {
              console.log(`\n  Rate limited, retrying ${temple.name}...`);
              continue;
            }
            return { temple, result: null };
          }
        }
        return { temple, result: null };
      })
    );

    // Update DB for successful results
    for (const r of results) {
      completed++;
      if (r.status === "fulfilled" && r.value?.result) {
        const { temple, result } = r.value;
        const updateData: any = {};
        if (result.description) updateData.description = result.description;
        if (result.deity_names) updateData.deity_names = result.deity_names;

        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from("temples")
            .update(updateData)
            .eq("id", temple.id);

          if (error) {
            failed++;
            console.error(`\n  DB error for ${temple.name}: ${error.message}`);
          } else {
            updated++;
          }
        }
      } else {
        failed++;
      }
    }

    process.stdout.write(
      `\r  Progress: ${completed}/${total} | Updated: ${updated} | Failed: ${failed}`
    );

    // Small delay between batches to stay under RPM limit
    if (i + concurrency < temples.length) {
      await sleep(500);
    }
  }

  return { updated, failed };
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get temples without descriptions (paginate)
  const allTemples: Temple[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("temples")
      .select("id, name, address, city, state, country, website")
      .is("description", null)
      .eq("is_published", true)
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    allTemples.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`${allTemples.length} temples need descriptions`);
  if (allTemples.length === 0) {
    console.log("All temples already have descriptions!");
    return;
  }

  console.log(
    `Processing with concurrency=${CONCURRENCY}, estimated time: ${Math.ceil(allTemples.length / CONCURRENCY / 2)} minutes`
  );

  const { updated, failed } = await processWithConcurrency(
    allTemples,
    CONCURRENCY,
    supabase
  );

  console.log(
    `\n\nDone! Updated: ${updated}, Failed: ${failed}, Total: ${allTemples.length}`
  );
}

main().catch(console.error);
