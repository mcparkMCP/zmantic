/**
 * Scrape ISKCON temple data from centres.iskcon.org
 * Primary source - try WP REST API first, fallback to HTML scraping
 *
 * Usage: npx tsx scripts/scrape-iskcon-centres.ts
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

const OUTPUT_FILE = "scripts/data/iskcon-centres.json";

async function tryWpApi(): Promise<RawTemple[] | null> {
  console.log("Trying WP REST API at centres.iskcon.org...");

  try {
    const res = await fetch(
      "https://centres.iskcon.org/wp-json/wp/v2/job_listing?per_page=100&page=1",
      { signal: AbortSignal.timeout(15000) }
    );

    if (!res.ok) {
      console.log(`WP API returned ${res.status}, falling back to HTML`);
      return null;
    }

    const totalPages = parseInt(res.headers.get("x-wp-totalpages") || "1");
    const allData: RawTemple[] = [];

    // Parse first page
    const firstPage = await res.json();
    allData.push(...parseWpListings(firstPage));

    // Fetch remaining pages
    for (let page = 2; page <= totalPages; page++) {
      console.log(`  Fetching page ${page}/${totalPages}...`);
      const pageRes = await fetch(
        `https://centres.iskcon.org/wp-json/wp/v2/job_listing?per_page=100&page=${page}`,
        { signal: AbortSignal.timeout(15000) }
      );
      if (pageRes.ok) {
        const pageData = await pageRes.json();
        allData.push(...parseWpListings(pageData));
      }
      // Be polite
      await new Promise((r) => setTimeout(r, 500));
    }

    return allData;
  } catch (err) {
    console.log(`WP API failed: ${err}`);
    return null;
  }
}

function parseWpListings(listings: any[]): RawTemple[] {
  return listings.map((listing: any) => {
    const meta = listing.meta || {};
    return {
      name: decodeHtml(listing.title?.rendered || ""),
      address: meta._job_location || meta.geolocation_formatted_address || "",
      city: meta.geolocation_city || "",
      state: meta.geolocation_state_long || "",
      country: meta.geolocation_country_long || "",
      postal_code: meta.geolocation_postcode || "",
      phone: meta._job_phone || "",
      email: meta._job_email || "",
      website: meta._job_website || "",
      lat: parseFloat(meta.geolocation_lat) || undefined,
      lng: parseFloat(meta.geolocation_long) || undefined,
      source_url: listing.link || "",
      source: "centres.iskcon.org",
    };
  });
}

async function scrapeHtml(): Promise<RawTemple[]> {
  console.log("Falling back to HTML scraping...");
  console.log(
    "Note: Install puppeteer (`npm i -D puppeteer`) for full HTML scraping."
  );
  console.log("For now, trying to fetch the page with fetch + cheerio...");

  try {
    // Dynamic import cheerio
    const cheerio = await import("cheerio");

    const res = await fetch("https://centres.iskcon.org/", {
      signal: AbortSignal.timeout(30000),
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const temples: RawTemple[] = [];

    // Parse listing elements (WP Job Manager typical structure)
    $(".job_listing, .type-job_listing, li.listing-item").each((_, el) => {
      const name =
        $(el).find(".job_listing-title, h3, h2").first().text().trim() || "";
      const location =
        $(el).find(".location, .job_listing-location").first().text().trim() ||
        "";
      const link = $(el).find("a").first().attr("href") || "";

      if (name) {
        const parts = location.split(",").map((s) => s.trim());
        temples.push({
          name,
          city: parts[0] || "",
          country: parts[parts.length - 1] || "",
          source_url: link,
          source: "centres.iskcon.org",
        });
      }
    });

    return temples;
  } catch (err) {
    console.error("HTML scraping failed:", err);
    return [];
  }
}

function decodeHtml(html: string): string {
  return html
    .replace(/&#8211;/g, "-")
    .replace(/&#8217;/g, "'")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]*>/g, "")
    .trim();
}

async function main() {
  fs.mkdirSync("scripts/data", { recursive: true });

  // Try WP API first
  let temples = await tryWpApi();

  // Fallback to HTML
  if (!temples || temples.length === 0) {
    temples = await scrapeHtml();
  }

  console.log(`\nScraped ${temples.length} temples from centres.iskcon.org`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(temples, null, 2));
  console.log(`Saved to ${OUTPUT_FILE}`);
}

main().catch(console.error);
