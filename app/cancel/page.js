"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const C = {
  bg: "#040d1a", surface: "#081829", card: "#0c2137",
  accent: "#00c2e0", green: "#06d6a0", text: "#e4f0f8", textDim: "#6a8da8",
  border: "#15334d", danger: "#ef476f",
};
const FONT = `'Noto Sans JP','Zen Maru Gothic',sans-serif`;

export default function CancelPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/create-portal", { method: "POST" });
      const data = await r.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error === "no_subscription" ? "サブスクリプションが見つかりません" : "エラーが発生しました");
      }
    } catch {
      alert("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: FONT, background: C.bg, color: C.text, minHeight: "100vh", maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <Link href="/" style={{ color: C.accent, fontSize: 13, textDecoration: "none" }}>← トップに戻る</Link>

      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 20, marginBottom: 24 }}>解約・キャンセルについて</h1>

      <div style={{ background: C.card, borderRadius: 12, padding: "16px 18px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.accent, marginBottom: 10 }}>解約方法</h2>
        <div style={{ fontSize: 13, lineHeight: 2 }}>
          <p>サブスクリプションの解約は、以下の手順で簡単に行えます：</p>
          <p style={{ marginTop: 8 }}>
            <strong style={{ color: C.accent }}>1.</strong> 下の「解約手続きへ進む」ボタンをクリック<br />
            <strong style={{ color: C.accent }}>2.</strong> Stripe Customer Portalが開きます<br />
            <strong style={{ color: C.accent }}>3.</strong> 「プランをキャンセル」を選択<br />
            <strong style={{ color: C.accent }}>4.</strong> 確認画面で解約を確定
          </p>
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 12, padding: "16px 18px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.accent, marginBottom: 10 }}>解約後について</h2>
        <div style={{ fontSize: 13, lineHeight: 2 }}>
          <p>・ 解約後も、現在の請求期間が終了するまでプレミアム機能を利用できます。</p>
          <p>・ 請求期間終了後は、1日5回の無料利用に戻ります。</p>
          <p>・ 釣果記録やお気に入り池のデータは保持されます。</p>
          <p>・ いつでも再度サブスクリプションに登録できます。</p>
        </div>
      </div>

      {session ? (
        <button
          onClick={openPortal}
          disabled={loading}
          style={{
            width: "100%",
            background: `${C.danger}22`,
            color: C.danger,
            border: `1px solid ${C.danger}44`,
            borderRadius: 14,
            padding: "14px 0",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginTop: 10,
          }}
        >
          {loading ? "読み込み中..." : "解約手続きへ進む（Stripe Customer Portal）"}
        </button>
      ) : (
        <div style={{ background: C.surface, borderRadius: 12, padding: 20, textAlign: "center", marginTop: 10, border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 13, color: C.textDim }}>解約手続きにはログインが必要です</p>
          <Link href="/" style={{ color: C.accent, fontSize: 14, fontWeight: 700 }}>ログインページへ →</Link>
        </div>
      )}

      <div style={{ background: `${C.accent}08`, borderRadius: 12, border: `1px solid ${C.accent}22`, padding: "14px 16px", marginTop: 20, fontSize: 12, color: C.textDim, lineHeight: 1.8 }}>
        ご不明な点がございましたら、メールにてお問い合わせください。
      </div>

      <div style={{ marginTop: 32, padding: "16px 0", borderTop: `1px solid ${C.border}`, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/legal" style={{ color: C.textDim, fontSize: 12 }}>特定商取引法に基づく表記</Link>
        <Link href="/terms" style={{ color: C.textDim, fontSize: 12 }}>利用規約</Link>
        <Link href="/privacy" style={{ color: C.textDim, fontSize: 12 }}>プライバシーポリシー</Link>
      </div>
    </div>
  );
}
