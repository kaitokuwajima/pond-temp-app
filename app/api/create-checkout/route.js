import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return Response.json({ error: "user not found" }, { status: 404 });

    // 二重課金防止
    if (user.subscriptionStatus === "active") {
      return Response.json({ error: "already_subscribed" }, { status: 400 });
    }

    let customerId = user.stripeCustomerId;
    if (customerId) {
      try {
        const c = await stripe.customers.retrieve(customerId);
        if (c.deleted) customerId = null;
      } catch {
        customerId = null;
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
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
