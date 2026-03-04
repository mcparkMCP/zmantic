import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const templeId = session.metadata?.temple_id;

    if (templeId) {
      const supabase = createAdminClient();
      await supabase.from("donations").upsert(
        {
          temple_id: templeId,
          stripe_session_id: session.id,
          amount_cents: session.amount_total || 0,
          currency: session.currency || "usd",
          donor_email: session.customer_email || session.customer_details?.email,
          donor_name: session.customer_details?.name,
          status: "completed",
        },
        { onConflict: "stripe_session_id" }
      );
    }
  }

  return NextResponse.json({ received: true });
}
