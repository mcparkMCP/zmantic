/**
 * Scrape ISKCON temple data from centers.iskcondesiretree.com
 * Secondary source - enumerate countries and parse listings
 *
 * Usage: npx tsx scripts/scrape-desiretree.ts
 */

import * as fs from "fs";

interface RawTemple {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  source_url?: string;
  source: string;
}

const OUTPUT_FILE = "scripts/data/desiretree-centres.json";

// Known country slugs on the site
const COUNTRIES = [
  "india",
  "united-states",
  "united-kingdom",
  "russia",
  "australia",
  "germany",
  "brazil",
  "south-africa",
  "canada",
  "italy",
  "france",
  "spain",
  "bangladesh",
  "ukraine",
  "mexico",
  "argentina",
  "china",
  "japan",
  "kenya",
  "nigeria",
  "peru",
  "colombia",
  "chile",
  "new-zealand",
  "malaysia",
  "singapore",
  "indonesia",
  "nepal",
  "sri-lanka",
  "mauritius",
  "fiji",
  "hungary",
  "poland",
  "czech-republic",
  "sweden",
  "finland",
  "norway",
  "denmark",
  "netherlands",
  "belgium",
  "switzerland",
  "austria",
  "ireland",
  "portugal",
  "romania",
  "bulgaria",
  "croatia",
  "serbia",
  "israel",
  "turkey",
  "pakistan",
  "iran",
  "ghana",
  "tanzania",
  "uganda",
  "trinidad-and-tobago",
  "guyana",
  "panama",
  "costa-rica",
  "ecuador",
  "philippines",
  "thailand",
];

async function scrapeCountry(countrySlug: string): Promise<RawTemple[]> {
  const url = `https://centers.iskcondesiretree.com/country/${countrySlug}/`;
  const temples: RawTemple[] = [];

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const html = await res.text();
    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);

    const countryName = countrySlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Parse temple entries
    $(".entry-content li, .temple-item, .center-item, article").each(
      (_, el) => {
        const text = $(el).text().trim();
        const link = $(el).find("a").first().attr("href") || "";
        const name = $(el).find("a, h3, h2, strong").first().text().trim();

        if (name && name.length > 3) {
          // Try to extract details from text
          const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
          const addressLines = lines.slice(1);
          const phoneLine = addressLines.find(
            (l) => l.match(/phone|tel|ph/i) || l.match(/^\+?\d[\d\s-]{6,}/)
          );
          const emailLine = addressLines.find((l) => l.includes("@"));

          temples.push({
            name,
            address: addressLines[0] || "",
            country: countryName,
            phone: phoneLine?.replace(/^(phone|tel|ph)[:\s]*/i, "").trim() || "",
            email: emailLine?.match(/[\w.-]+@[\w.-]+/)?.[0] || "",
            website: link.startsWith("http") ? link : "",
            source_url: url,
            source: "iskcondesiretree.com",
          });
        }
      }
    );

    return temples;
  } catch (err) {
    console.error(`  Failed to scrape ${countrySlug}: ${err}`);
    return [];
  }
}

async function main() {
  fs.mkdirSync("scripts/data", { recursive: true });

  const allTemples: RawTemple[] = [];

  for (const country of COUNTRIES) {
    process.stdout.write(`Scraping ${country}...`);
    const temples = await scrapeCountry(country);
    allTemples.push(...temples);
    console.log(` ${temples.length} temples`);

    // Be polite
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nScraped ${allTemples.length} temples from iskcondesiretree.com`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allTemples, null, 2));
  console.log(`Saved to ${OUTPUT_FILE}`);
}

main().catch(console.error);
