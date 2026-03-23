"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState("サブスクリプションを確認中...");

  useEffect(() => {
    const customerId = searchParams.get("customer_id");
    if (customerId) {
      localStorage.setItem("pondCustomerId", customerId);
      localStorage.setItem(
        "pondPremium",
        JSON.stringify({ active: true, checkedAt: Date.now() })
      );
      setMsg("登録完了！無制限でご利用いただけます。");
    }
    const t = setTimeout(() => router.push("/"), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#040d1a",
        color: "#e4f0f8",
        fontFamily: "'Noto Sans JP', sans-serif",
        gap: 16,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 64 }}>🎉</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>お支払いありがとうございます！</div>
      <div style={{ fontSize: 15, color: "#00c2e0", fontWeight: 700 }}>{msg}</div>
      <div style={{ fontSize: 12, color: "#6a8da8", marginTop: 8 }}>
        3秒後にトップページへ戻ります...
      </div>
    </div>
  );
}
