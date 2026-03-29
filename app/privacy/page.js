"use client";

import Link from "next/link";

const C = {
  bg: "#040d1a", surface: "#081829", card: "#0c2137",
  accent: "#00c2e0", text: "#e4f0f8", textDim: "#6a8da8", border: "#15334d",
};
const FONT = `'Noto Sans JP','Zen Maru Gothic',sans-serif`;

function Section({ title, children }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, padding: "16px 18px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: C.accent, marginBottom: 10 }}>{title}</h2>
      <div style={{ fontSize: 13, lineHeight: 2, color: C.text }}>{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: FONT, background: C.bg, color: C.text, minHeight: "100vh", maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <Link href="/" style={{ color: C.accent, fontSize: 13, textDecoration: "none" }}>← トップに戻る</Link>

      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 20, marginBottom: 24 }}>プライバシーポリシー</h1>

      <Section title="1. 取得する情報">
        本サービスでは、以下の情報を取得します：
        <p>・ メールアドレス（Google/Appleアカウント連携時）</p>
        <p>・ 表示名・プロフィール画像（Google/Appleアカウント連携時）</p>
        <p>・ サービス利用状況（水温検索回数、利用日時）</p>
        <p>・ 決済情報（Stripe経由、当方ではカード情報を直接保持しません）</p>
      </Section>

      <Section title="2. 利用目的">
        取得した情報は、以下の目的で利用します：
        <p>・ ユーザー認証およびアカウント管理</p>
        <p>・ サービス利用回数の管理</p>
        <p>・ サブスクリプション・決済の処理</p>
        <p>・ サービスの改善・不具合対応</p>
        <p>・ 重要なお知らせの通知</p>
      </Section>

      <Section title="3. 第三者への情報共有">
        <p>当方は、以下の場合を除き、取得した個人情報を第三者に提供しません：</p>
        <p>・ <strong style={{ color: C.accent }}>Stripe, Inc.</strong>：決済処理のため、メールアドレスおよび決済に必要な情報を共有します。Stripeのプライバシーポリシーは stripe.com/privacy をご確認ください。</p>
        <p>・ <strong style={{ color: C.accent }}>Google / Apple</strong>：OAuth認証のため、認証情報の交換が行われます。</p>
        <p>・ 法令に基づく開示が求められた場合</p>
      </Section>

      <Section title="4. データの保管">
        <p>・ ユーザーデータはセキュアなデータベースに保管されます。</p>
        <p>・ クレジットカード情報は当方では一切保持せず、Stripeが管理します。</p>
        <p>・ アカウント削除をご希望の場合は、メールにてお問い合わせください。</p>
      </Section>

      <Section title="5. Cookieの利用">
        本サービスでは、ログイン状態の維持のためにCookie（セッションCookie）を利用しています。
      </Section>

      <Section title="6. ポリシーの変更">
        本ポリシーは、必要に応じて変更されることがあります。重要な変更がある場合は、本ページにて告知します。
      </Section>

      <div style={{ marginTop: 20, fontSize: 12, color: C.textDim }}>
        制定日: 2026年3月29日
      </div>

      <div style={{ marginTop: 32, padding: "16px 0", borderTop: `1px solid ${C.border}`, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/legal" style={{ color: C.textDim, fontSize: 12 }}>特定商取引法に基づく表記</Link>
        <Link href="/terms" style={{ color: C.textDim, fontSize: 12 }}>利用規約</Link>
        <Link href="/cancel" style={{ color: C.textDim, fontSize: 12 }}>解約について</Link>
      </div>
    </div>
  );
}
