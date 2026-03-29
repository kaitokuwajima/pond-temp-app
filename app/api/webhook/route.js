import Stripe from "stripe";

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Webhook signature verification failed:", e.message);
    return Response.json({ error: e.message }, { status: 400 });
  }

  // ログ出力（サブスク状態はStripe APIで都度確認するため、DB更新不要）
  switch (event.type) {
    case "checkout.session.completed":
      console.log("Checkout completed:", event.data.object.customer);
      break;
    case "invoice.payment_failed":
      console.log("Payment failed:", event.data.object.customer);
      break;
    case "customer.subscription.deleted":
      console.log("Subscription cancelled:", event.data.object.customer);
      break;
    case "customer.subscription.updated":
      console.log("Subscription updated:", event.data.object.customer);
      break;
  }

  return Response.json({ received: true });
}
