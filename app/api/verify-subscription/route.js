import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  if (!customerId) return Response.json({ active: false });

  try {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    return Response.json({ active: subs.data.length > 0 });
  } catch (e) {
    console.error("verify-subscription error:", e);
    return Response.json({ active: false });
  }
}
