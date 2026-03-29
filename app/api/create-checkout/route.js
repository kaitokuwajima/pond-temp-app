import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // メールでStripe顧客を検索
    const existing = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    let customerId;
    if (existing.data.length > 0) {
      const customer = existing.data[0];
      // 二重課金防止: 既にアクティブなサブスクがあるか確認
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });
      if (subs.data.length > 0) {
        return Response.json({ error: "already_subscribed" }, { status: 400 });
      }
      customerId = customer.id;
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: { authProvider: session.user.provider || "unknown" },
      });
      customerId = customer.id;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
      locale: "ja",
    });

    return Response.json({ url: checkoutSession.url });
  } catch (e) {
    console.error("create-checkout error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
