import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  try {
    stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    // Subscription status is verified live via /api/verify-subscription
    return Response.json({ received: true });
  } catch (e) {
    console.error("webhook error:", e.message);
    return Response.json({ error: e.message }, { status: 400 });
  }
}
