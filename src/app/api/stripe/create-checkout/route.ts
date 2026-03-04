import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const schema = z.object({
  temple_slug: z.string().min(1),
  amount_cents: z.number().int().min(100), // minimum $1
  currency: z.string().default("usd"),
  donor_email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { temple_slug, amount_cents, currency, donor_email } = parsed.data;

    // Look up temple
    const supabase = createAdminClient();
    const { data: temple } = await supabase
      .from("temples")
      .select("id, name, slug, stripe_metadata_tag")
      .eq("slug", temple_slug)
      .single();

    if (!temple) {
      return NextResponse.json({ error: "Temple not found" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Donation to ${temple.name}`,
              description: `Supporting ${temple.name} ISKCON temple`,
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        temple_id: temple.id,
        temple_slug: temple.slug,
        temple_tag: temple.stripe_metadata_tag || temple.slug,
      },
      ...(donor_email && { customer_email: donor_email }),
      success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/donate/${temple.slug}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
