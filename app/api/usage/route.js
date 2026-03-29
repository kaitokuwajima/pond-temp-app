import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../lib/prisma";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// GET: 現在の利用回数を取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return Response.json({ error: "user not found" }, { status: 404 });

  const today = todayStr();
  let usageCount = user.usageCount;

  // 0時リセット処理
  if (user.lastResetDate !== today) {
    await prisma.user.update({
      where: { id: user.id },
      data: { usageCount: 0, lastResetDate: today },
    });
    usageCount = 0;
  }

  return Response.json({
    usageCount,
    subscriptionActive: user.subscriptionStatus === "active",
    dailyLimit: 5,
    remaining: Math.max(0, 5 - usageCount),
  });
}

// POST: 利用回数をインクリメント
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return Response.json({ error: "user not found" }, { status: 404 });

  // サブスク会員は無制限
  if (user.subscriptionStatus === "active") {
    return Response.json({ allowed: true, usageCount: user.usageCount, remaining: Infinity });
  }

  const today = todayStr();
  let currentCount = user.usageCount;

  // 0時リセット
  if (user.lastResetDate !== today) {
    currentCount = 0;
  }

  // 上限チェック
  if (currentCount >= 5) {
    return Response.json({ allowed: false, usageCount: currentCount, remaining: 0 });
  }

  // インクリメント
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { usageCount: currentCount + 1, lastResetDate: today },
  });

  return Response.json({
    allowed: true,
    usageCount: updated.usageCount,
    remaining: Math.max(0, 5 - updated.usageCount),
  });
}
