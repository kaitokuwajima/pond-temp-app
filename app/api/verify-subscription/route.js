import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ active: false });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    return Response.json({ active: user?.subscriptionStatus === "active" });
  } catch (e) {
    console.error("verify-subscription error:", e);
    return Response.json({ active: false });
  }
}
