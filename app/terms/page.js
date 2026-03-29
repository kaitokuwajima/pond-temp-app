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

export default function TermsPage() {
  return (
    <div style={{ fontFamily: FONT, background: C.bg, color: C.text, minHeight: "100vh", maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <Link href="/" style={{ color: C.accent, fontSize: 13, textDecoration: "none" }}>← トップに戻る</Link>

      <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 20, marginBottom: 24 }}>利用規約</h1>

      <Section title="第1条（適用）">
        本規約は、池温よそく（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは、本サービスを利用することにより、本規約に同意したものとみなされます。
      </Section>

      <Section title="第2条（利用回数制限）">
        <p>1. 無料ユーザーは、1日あたり5回まで水温予測機能を利用できます。</p>
        <p>2. 利用回数は毎日午前0時（日本時間）にリセットされます。</p>
        <p>3. 月額サブスクリプションに登録したユーザーは、利用回数の制限なく本サービスを利用できます。</p>
      </Section>

      <Section title="第3条（サブスクリプション）">
        <p>1. サブスクリプションの料金は月額100円（税込）です。</p>
        <p>2. 支払いはクレジットカードによるStripe経由の決済となります。</p>
        <p>3. サブスクリプションは自動更新されます。</p>
        <p>4. 解約はいつでもStripe Customer Portalから可能です。</p>
        <p>5. 解約後も、支払い済みの期間が終了するまで本サービスを利用できます。</p>
      </Section>

      <Section title="第4条（アカウント）">
        <p>1. 本サービスの利用にはGoogleまたはAppleアカウントによるログインが必要です。</p>
        <p>2. ユーザーは自身のアカウント情報を適切に管理する責任を負います。</p>
        <p>3. アカウントの不正利用により生じた損害について、当方は一切の責任を負いません。</p>
      </Section>

      <Section title="第5条（禁止事項）">
        ユーザーは、以下の行為を行ってはなりません：
        <p>1. 本サービスの不正利用、またはそのおそれのある行為</p>
        <p>2. サーバーやネットワークに過度の負荷をかける行為</p>
        <p>3. 自動化ツール等を用いた大量リクエスト</p>
        <p>4. 本サービスのリバースエンジニアリング</p>
        <p>5. 他のユーザーの利用を妨害する行為</p>
        <p>6. 法令または公序良俗に反する行為</p>
      </Section>

      <Section title="第6条（免責事項）">
        <p>1. 本サービスが提供する水温予測はあくまで推定値であり、実際の水温との誤差が生じる場合があります（精度目安: ±2〜3℃）。</p>
        <p>2. 本サービスの利用に基づく行動（釣行等）により生じた損害について、当方は一切の責任を負いません。</p>
        <p>3. 外部APIの障害やメンテナンスにより、一時的にサービスが利用できない場合があります。</p>
      </Section>

      <Section title="第7条（サービスの変更・停止）">
        <p>1. 当方は、事前の通知なく本サービスの内容を変更、または提供を停止できるものとします。</p>
        <p>2. サービス停止に伴い、有効なサブスクリプションがある場合は、残存期間分の返金対応を検討します。</p>
      </Section>

      <Section title="第8条（規約の変更）">
        当方は、必要に応じて本規約を変更できるものとします。変更後の規約は本ページに掲載した時点で効力を生じます。
      </Section>

      <div style={{ marginTop: 20, fontSize: 12, color: C.textDim }}>
        制定日: 2026年3月29日
      </div>

      <div style={{ marginTop: 32, padding: "16px 0", borderTop: `1px solid ${C.border}`, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/legal" style={{ color: C.textDim, fontSize: 12 }}>特定商取引法に基づく表記</Link>
        <Link href="/privacy" style={{ color: C.textDim, fontSize: 12 }}>プライバシーポリシー</Link>
        <Link href="/cancel" style={{ color: C.textDim, fontSize: 12 }}>解約について</Link>
      </div>
    </div>
  );
}
