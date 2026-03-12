/**
 * Scrape temple websites to extract contact info and cover images.
 * Only processes temples that have a website URL.
 *
 * Usage: npx tsx scripts/scrape-temple-websites.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONCURRENCY = 5;
const TIMEOUT = 15000;

interface ScrapedData {
  phone?: string;
  email?: string;
  cover_image?: string;
}

async function scrapeWebsite(url: string): Promise<ScrapedData | null> {
  try {
    // Normalize URL
    if (!url.startsWith("http")) url = `https://${url}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Zmantic/1.0; +https://zmantic.com)",
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);
    const data: ScrapedData = {};

    // Extract phone numbers
    const phonePatterns = [
      $('a[href^="tel:"]').first().attr("href")?.replace("tel:", ""),
      $('a[href^="tel:"]').first().text().trim(),
    ];
    // Search in meta or common elements
    const pageText = $("body").text();
    const phoneMatch = pageText.match(
      /(?:phone|tel|call)[:\s]*([+\d][\d\s()-]{7,})/i
    );
    if (phoneMatch) phonePatterns.push(phoneMatch[1].trim());

    data.phone = phonePatterns.find(
      (p) => p && p.length > 6 && /\d{6,}/.test(p.replace(/\D/g, ""))
    );

    // Extract email
    const emailPatterns = [
      $('a[href^="mailto:"]').first().attr("href")?.replace("mailto:", ""),
    ];
    const emailMatch = pageText.match(
      /[\w.+-]+@[\w-]+\.[\w.-]+/
    );
    if (emailMatch) emailPatterns.push(emailMatch[0]);

    data.email = emailPatterns.find(
      (e) =>
        e &&
        e.includes("@") &&
        !e.includes("example") &&
        !e.includes("sentry") &&
        !e.includes("webpack")
    );

    // Extract cover/hero image
    const imagePatterns = [
      $('meta[property="og:image"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
      $(".hero img, .banner img, .header img, .cover img")
        .first()
        .attr("src"),
      $('img[class*="hero"], img[class*="banner"], img[class*="cover"]')
        .first()
        .attr("src"),
      // First large image in the page
      $("img")
        .filter((_, el) => {
          const w = parseInt($(el).attr("width") || "0");
          return w > 400;
        })
        .first()
        .attr("src"),
    ];

    const rawImage = imagePatterns.find(
      (i) =>
        i &&
        i.length > 10 &&
        !i.includes("logo") &&
        !i.includes("icon") &&
        !i.includes("favicon") &&
        !i.includes("avatar") &&
        (i.includes(".jpg") ||
          i.includes(".jpeg") ||
          i.includes(".png") ||
          i.includes(".webp") ||
          i.includes("image"))
    );

    if (rawImage) {
      // Make absolute URL
      try {
        data.cover_image = new URL(rawImage, url).href;
      } catch {
        data.cover_image = rawImage;
      }
    }

    // Only return if we found something new
    if (data.phone || data.email || data.cover_image) return data;
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

  // Get temples with websites (paginate)
  const allTemples: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("temples")
      .select("id, name, website, phone, email, cover_image")
      .not("website", "is", null)
      .neq("website", "")
      .eq("is_published", true)
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    allTemples.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`${allTemples.length} temples have websites to scrape`);

  let scraped = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < allTemples.length; i += CONCURRENCY) {
    const chunk = allTemples.slice(i, i + CONCURRENCY);

    const results = await Promise.allSettled(
      chunk.map(async (temple) => {
        const data = await scrapeWebsite(temple.website);
        return { temple, data };
      })
    );

    for (const r of results) {
      scraped++;
      if (r.status === "fulfilled" && r.value.data) {
        const { temple, data } = r.value;
        const updateData: any = {};

        // Only update fields that are currently empty
        if (data.phone && !temple.phone) updateData.phone = data.phone;
        if (data.email && !temple.email) updateData.email = data.email;
        if (data.cover_image && !temple.cover_image)
          updateData.cover_image = data.cover_image;

        if (Object.keys(updateData).length > 0) {
          await supabase.from("temples").update(updateData).eq("id", temple.id);
          updated++;
        }
      } else {
        failed++;
      }
    }

    process.stdout.write(
      `\r  Progress: ${scraped}/${allTemples.length} | Updated: ${updated} | Failed: ${failed}`
    );

    await sleep(500);
  }

  console.log(
    `\n\nDone! Scraped: ${scraped}, Updated: ${updated}, Failed: ${failed}`
  );
}

main().catch(console.error);
