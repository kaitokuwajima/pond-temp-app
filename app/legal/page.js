"use client";

import Link from "next/link";

const C = {
  bg: "#040d1a", surface: "#081829", card: "#0c2137",
  accent: "#00c2e0", text: "#e4f0f8", textDim: "#6a8da8", border: "#15334d",
};
const FONT = `'Noto Sans JP','Zen Maru Gothic',sans-serif`;

export default function LegalPage() {
  return (
    <div style={{ fontFamily: FONT, background: C.bg, color: C.text, minHeight: "100vh", maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <Link href="/" style={{ color: C.accent, fontSize: 13, textDecoration: "none" }}>← トップに戻る</Link>

      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 20, marginBottom: 24 }}>特定商取引法に基づく表記</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[
          { label: "事業者名", value: "池温よそく運営事務局" },
          { label: "運営責任者", value: "桑島海斗" },
          { label: "所在地", value: "香川県高松市高松町1489-1 ディアス高松A 201号" },
          { label: "メールアドレス", value: "kaito.k0626@gmail.com" },
          { label: "販売価格", value: "月額100円（税込）" },
          { label: "支払い方法", value: "クレジットカード（Stripe経由）" },
          { label: "支払い時期", value: "サブスクリプション登録時に初回決済。以降、毎月自動更新。" },
          { label: "サービス提供時期", value: "決済完了後、即時利用可能" },
          { label: "返品・キャンセルについて", value: "デジタルサービスの性質上、返品はお受けできません。サブスクリプションはいつでもキャンセル可能で、キャンセル後は次回更新日まで利用できます。" },
          { label: "解約方法", value: "マイページからStripe Customer Portalにアクセスし、ご自身で解約手続きが可能です。" },
        ].map((item, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: "16px 0", borderTop: `1px solid ${C.border}`, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/terms" style={{ color: C.textDim, fontSize: 12 }}>利用規約</Link>
        <Link href="/privacy" style={{ color: C.textDim, fontSize: 12 }}>プライバシーポリシー</Link>
        <Link href="/cancel" style={{ color: C.textDim, fontSize: 12 }}>解約について</Link>
      </div>
    </div>
  );
}
