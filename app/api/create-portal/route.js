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

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeCustomerId) {
    return Response.json({ error: "no_subscription" }, { status: 400 });
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    });

    return Response.json({ url: portalSession.url });
  } catch (e) {
    console.error("create-portal error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
