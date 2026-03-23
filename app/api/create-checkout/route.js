import Stripe from "stripe";

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const { customerId } = await req.json();

    let customer = null;
    if (customerId) {
      try {
        const c = await stripe.customers.retrieve(customerId);
        if (!c.deleted) customer = c;
      } catch {}
    }
    if (!customer) {
      customer = await stripe.customers.create();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}&customer_id=${customer.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
      locale: "ja",
    });

    return Response.json({ url: session.url, customerId: customer.id });
  } catch (e) {
    console.error("create-checkout error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
