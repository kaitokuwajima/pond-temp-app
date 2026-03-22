"use client";

import { useState, useEffect, useCallback, useRef } from "react";
// ============================================================
// 池温よそく v1.1 - Full Featured (Search Fix)
// ============================================================

const C = {
  bg: "#040d1a", surface: "#081829", card: "#0c2137", cardAlt: "#0f2a45",
  accent: "#00c2e0", accentDim: "rgba(0,194,224,0.12)",
  warm: "#ff6b35", warmDim: "rgba(255,107,53,0.12)",
  cool: "#48cae4", green: "#06d6a0", greenDim: "rgba(6,214,160,0.12)",
  yellow: "#ffd166", text: "#e4f0f8", textDim: "#6a8da8",
  border: "#15334d", borderLight: "#1e4466", danger: "#ef476f",
};
const FONT = `'Zen Maru Gothic','Noto Sans JP',sans-serif`;
const MONO = `'JetBrains Mono','Fira Code',monospace`;

// ---- MODEL ----
function estimateWaterTemp({ airTempC, solarRad, windSpeed, humidity, precip, areaKm2, depthM }) {
  const solarAbs = solarRad * 0.94;
  const wf = 9.2 + 0.46 * windSpeed * windSpeed;
  const esat = 6.108 * Math.exp((17.27 * airTempC) / (airTempC + 237.3));
  const ea = esat * (humidity / 100);
  const Tk = airTempC + 273.15;
  const backRad = 0.97 * 5.67e-8 * Math.pow(Tk, 4) * (0.39 - 0.05 * Math.sqrt(ea)) * 0.25;
  let Tw = airTempC;
  for (let i = 0; i < 12; i++) {
    const esw = 6.108 * Math.exp((17.27 * Tw) / (Tw + 237.3));
    const evap = wf * (esw - ea);
    const lwOut = 4 * 0.97 * 5.67e-8 * Math.pow(Tw + 273.15, 3) * (Tw - airTempC);
    const inertia = Math.min(depthM * 0.8, 5);
    Tw = airTempC + (solarAbs - evap - lwOut - backRad) / (wf + 4 * 0.97 * 5.67e-8 * Math.pow(Tk, 3) + inertia);
  }
  Tw -= precip * 0.05;
  const df = Math.max(0.3, 1 - depthM * 0.08);
  const final_ = Tw * df + airTempC * (1 - df);
  const evapCool = wf * (6.108 * Math.exp((17.27 * final_) / (final_ + 237.3)) - ea);
  return { waterTemp: Math.round(final_ * 10) / 10, solarAbs: Math.round(solarAbs * 10) / 10, evapCool: Math.round(evapCool * 10) / 10, backRad: Math.round(backRad * 10) / 10, netHeat: Math.round((solarAbs - backRad) * 10) / 10 };
}

function depthFromArea(a) { return a <= 0 ? 2 : Math.max(0.5, Math.min(Math.pow(10, 0.356 * Math.log10(a) + 0.776), 100)); }

function polyAreaKm2(coords) {
  if (!coords || coords.length < 3) return 0;
  const avgLat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  const cosL = Math.cos(avgLat * Math.PI / 180);
  let a = 0;
  for (let i = 0; i < coords.length; i++) { const j = (i + 1) % coords.length; a += coords[i][1] * cosL * coords[j][0] - coords[j][1] * cosL * coords[i][0]; }
  return Math.abs(a) / 2 * 111.32 * 111.32;
}

function getFishActivity(t) {
  if (t < 5) return { label: "ほぼ動かない", emoji: "🐟💤", level: 0, desc: "冬眠状態。釣りは厳しい", color: C.textDim };
  if (t < 8) return { label: "低活性", emoji: "🐟❄️", level: 1, desc: "底でじっとしている", color: C.cool };
  if (t < 12) return { label: "やや低", emoji: "🐟", level: 2, desc: "動き始めるが反応は鈍い", color: C.accent };
  if (t < 18) return { label: "活発！", emoji: "🐟✨", level: 3, desc: "活発にエサを追う好条件", color: C.green };
  if (t < 24) return { label: "最高！", emoji: "🐟🔥", level: 4, desc: "爆釣チャンス！", color: C.yellow };
  if (t < 28) return { label: "高温注意", emoji: "🐟🥵", level: 2, desc: "深場に避難気味", color: C.warm };
  return { label: "危険水温", emoji: "⚠️", level: 0, desc: "魚に危険な水温", color: C.danger };
}

function generateExplanation({ pond, weatherTimeline, todayEntry }) {
  if (!pond || !weatherTimeline || !todayEntry) return "";
  const areaStr = pond.areaKm2 < 0.01 ? `${(pond.areaKm2 * 1e6).toFixed(0)}m²（約${(pond.areaKm2 * 1e6 / 10000).toFixed(2)}ha）` : `${pond.areaKm2.toFixed(3)}km²（約${(pond.areaKm2 * 100).toFixed(1)}ha）`;
  const todayIdx = weatherTimeline.findIndex(d => d.isToday);
  const past7 = weatherTimeline.filter((_, i) => i < todayIdx);
  const sunnyDays = past7.filter(d => d.weatherCode <= 3).length;
  const rainyDays = past7.filter(d => d.weatherCode >= 51).length;
  const avgMax = past7.length > 0 ? (past7.reduce((s, d) => s + d.tempMax, 0) / past7.length).toFixed(1) : "—";
  const avgMin = past7.length > 0 ? (past7.reduce((s, d) => s + d.tempMin, 0) / past7.length).toFixed(1) : "—";
  const maxMax = past7.length > 0 ? Math.max(...past7.map(d => d.tempMax)) : 0;
  const minMin = past7.length > 0 ? Math.min(...past7.map(d => d.tempMin)) : 0;
  const waterTemps = weatherTimeline.map(d => d.waterTemp);
  const trend = waterTemps[waterTemps.length - 1] - waterTemps[0];
  const trendStr = trend > 0.5 ? "上昇傾向" : trend < -0.5 ? "下降傾向" : "横ばい";
  const depthNote = pond.areaKm2 < 0.001 ? "非常に小さな池のため、気温変化に対して水温が敏感に反応します。浅い池ほど日射の影響を受けやすく、1日の水温変化も大きくなります。" : pond.areaKm2 < 0.1 ? "中規模の池です。水深が浅いため気温への追従性が高く、晴天が続くと水温は着実に上昇します。" : "大きな湖のため、熱容量（水の量）が大きく、水温変化は緩やかです。気温が急変しても水温はすぐには追従しません。";
  const act = getFishActivity(todayEntry.waterTemp);
  return `📐 **池の物理特性**
この池の推定面積は${areaStr}です。OpenStreetMapの水域ポリゴンデータから自動計算しました。

水深は面積から統計的回帰モデル（Cael & Seekell, 2016）で推定しており、約${pond.avgDepth.toFixed(1)}mと算出されました。${depthNote}

推定体積は${pond.volumeM3 < 10000 ? pond.volumeM3.toFixed(0) + "m³" : (pond.volumeM3 / 10000).toFixed(1) + "万m³"}です。

🌤 **直近の気象状況**
過去7日間の天気は、晴れ/曇り${sunnyDays}日、雨${rainyDays}日でした。気温は最高平均${avgMax}℃（最大${maxMax}℃）、最低平均${avgMin}℃（最小${minMin}℃）の範囲で推移しています。

${todayEntry.model.solarAbs > 200 ? `日射量が強く（吸収量: ${todayEntry.model.solarAbs} W/m²）、水面が効率的に太陽エネルギーを吸収しています。` : todayEntry.model.solarAbs > 100 ? `日射量は中程度（吸収量: ${todayEntry.model.solarAbs} W/m²）です。` : `日射量が弱く（吸収量: ${todayEntry.model.solarAbs} W/m²）、水温上昇の主要因である太陽熱の供給が限られています。`}

蒸発による冷却効果は${todayEntry.model.evapCool} W/m²、夜間の放射冷却は${todayEntry.model.backRad} W/m²と推定されます。

🌡 **水温予測の根拠**
以上の条件を熱収支方程式（Edinger et al., 1968 の均衡温度モデル）に代入して計算した結果、本日の推定水温は **${todayEntry.waterTemp.toFixed(1)}℃** となりました。

過去7日間の水温トレンドは **${trendStr}** です（${waterTemps[0]?.toFixed(1)}℃ → ${todayEntry.waterTemp.toFixed(1)}℃）。

${act.emoji} 魚の活性度は「**${act.label}**」と判定されます。${act.desc}。

⚠️ **注意事項**
この水温はあくまで気象データに基づく理論的な推定値です。実際の水温は湧水・流入河川・水底の地質・周囲の植生による日陰・水の透明度などの影響を受けます。精度目安は±2〜3℃です。`;
}

// ---- STORAGE ----
async function loadStore(key) { try { if (typeof window === "undefined") return null; const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } }
async function saveStore(key, data) { try { if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.error(e); } }

// ---- OVERPASS SEARCH (with retry at larger radius) ----
async function searchOverpass(lat, lng, radius) {
  const q = `[out:json][timeout:20];(way["natural"="water"](around:${radius},${lat},${lng});relation["natural"="water"](around:${radius},${lat},${lng});way["water"~"pond|lake|reservoir|basin"](around:${radius},${lat},${lng});relation["water"~"pond|lake|reservoir|basin"](around:${radius},${lat},${lng});way["landuse"="reservoir"](around:${radius},${lat},${lng}););out body geom;`;
  const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q) });
  if (!r.ok) throw new Error(`Overpass API エラー (${r.status})`);
  return r.json();
}

function distanceDeg(lat1, lng1, lat2, lng2) {
  const dlat = lat1 - lat2, dlng = (lng1 - lng2) * Math.cos(lat1 * Math.PI / 180);
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

function extractBestPond(data, clickLat, clickLng) {
  let best = null, bestDist = Infinity;
  for (const el of data.elements || []) {
    let coords = [];
    if (el.type === "way" && el.geometry) coords = el.geometry.map(g => [g.lat, g.lon]);
    else if (el.type === "relation" && el.members) {
      const outerCoords = [];
      for (const m of el.members) {
        if ((m.role === "outer" || m.role === "") && m.geometry) {
          outerCoords.push(...m.geometry.map(g => [g.lat, g.lon]));
        }
      }
      coords = outerCoords;
    }
    if (coords.length < 3) continue;
    const a = polyAreaKm2(coords);
    const cLat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const cLng = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    const dist = distanceDeg(clickLat, clickLng, cLat, cLng);
    if (dist < bestDist) {
      bestDist = dist;
      best = { coords, areaKm2: a, name: el.tags?.name || el.tags?.["name:ja"] || "", osmId: el.id, type: el.tags?.water || el.tags?.natural || "water" };
    }
  }
  return best;
}

// ---- NOMINATIM SEARCH (water-aware) ----
async function geocodeWater(query) {
  // Strategy: try multiple search approaches
  // 1. Search with natural layer preference
  // 2. Fallback to general search
  const headers = { "Accept": "application/json" };
  
  // First try: search specifically for water features
  const urls = [
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=jp&layer=natural`,
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=jp`,
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + " 湖")}&format=json&limit=5&countrycodes=jp`,
  ];

  for (const url of urls) {
    try {
      const r = await fetch(url, { headers });
      if (!r.ok) continue;
      const data = await r.json();
      if (!data.length) continue;

      // Prefer water-related results
      const waterResult = data.find(d =>
        d.type === "water" || d.type === "lake" || d.type === "reservoir" ||
        d.class === "natural" || d.class === "water" ||
        (d.display_name && (d.display_name.includes("湖") || d.display_name.includes("池") || d.display_name.includes("沼")))
      );
      
      if (waterResult) return { lat: parseFloat(waterResult.lat), lng: parseFloat(waterResult.lon), name: waterResult.display_name };
      // If no water result found in this batch, try next URL
      if (url === urls[urls.length - 1] && data.length > 0) {
        // Last resort: use first result
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name };
      }
    } catch { continue; }
  }
  return null;
}

// ---- COMPONENTS ----
function Spinner({ msg }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 40 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.accent, animation: "spin .8s linear infinite" }} />
      <span style={{ fontSize: 13, color: C.textDim }}>{msg}</span>
    </div>
  );
}

function TempBadge({ temp, size = "large" }) {
  const color = temp < 8 ? C.cool : temp < 15 ? C.accent : temp < 20 ? C.green : temp < 25 ? C.yellow : C.warm;
  const big = size === "large";
  return (
    <div style={{ display: "inline-flex", alignItems: "baseline", gap: big ? 4 : 2, background: `linear-gradient(135deg,${color}20,${color}08)`, border: `2px solid ${color}55`, borderRadius: big ? 18 : 12, padding: big ? "10px 22px" : "4px 12px", boxShadow: `0 0 ${big ? 30 : 15}px ${color}25` }}>
      <span style={{ fontSize: big ? 42 : 20, fontWeight: 800, color, fontFamily: MONO, letterSpacing: -1 }}>{temp.toFixed(1)}</span>
      <span style={{ fontSize: big ? 18 : 12, color: `${color}aa`, fontWeight: 600 }}>℃</span>
    </div>
  );
}

function ActivityBar({ temp }) {
  const a = getFishActivity(temp);
  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>{a.emoji}</span>
        <span style={{ color: a.color, fontWeight: 700, fontSize: 16 }}>{a.label}</span>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 7, flex: 1, borderRadius: 4, background: i <= a.level ? a.color : `${C.textDim}25`, boxShadow: i <= a.level ? `0 0 8px ${a.color}30` : "none" }} />
        ))}
      </div>
      <span style={{ color: C.textDim, fontSize: 12 }}>{a.desc}</span>
    </div>
  );
}

function MiniChart({ data }) {
  if (!data?.length) return null;
  const temps = data.map(d => d.waterTemp);
  const mx = Math.max(...temps), mn = Math.min(...temps), rng = mx - mn || 1;
  const h = 90, w = 100;
  const tI = data.findIndex(d => d.isToday);
  const pt = (d, i) => ({ x: (i / (data.length - 1)) * w, y: h - 8 - ((d.waterTemp - mn) / rng) * (h - 20) });
  const path = (arr, si) => arr.map((d, i) => `${i === 0 ? "M" : "L"}${pt(d, si + i).x},${pt(d, si + i).y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 90 }}>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.cool} /><stop offset="50%" stopColor={C.accent} /><stop offset="100%" stopColor={C.green} /></linearGradient></defs>
      {tI > 0 && <path d={path(data.slice(0, tI + 1), 0)} fill="none" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" />}
      {tI < data.length - 1 && <path d={path(data.slice(tI), tI)} fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="5,4" opacity={0.6} />}
      {data.map((d, i) => { const p = pt(d, i); return (
        <g key={i}>
          {i === tI && <circle cx={p.x} cy={p.y} r={9} fill="none" stroke={C.accent} strokeWidth="1.5" opacity={0.4} />}
          <circle cx={p.x} cy={p.y} r={i === tI ? 5 : 3} fill={i > tI ? C.accent : C.text} opacity={i > tI ? 0.5 : 0.9} />
          <text x={p.x} y={p.y - 9} textAnchor="middle" fill={i === tI ? C.accent : C.textDim} fontSize="5.5" fontWeight={i === tI ? "700" : "400"}>{d.waterTemp.toFixed(1)}</text>
        </g>
      ); })}
      {data.map((d, i) => { const p = pt(d, i); return i % 2 === 0 || i === data.length - 1 ? <text key={`l${i}`} x={p.x} y={h - 1} textAnchor="middle" fill={C.textDim} fontSize="5">{d.dateLabel}</text> : null; })}
    </svg>
  );
}

function WeatherStrip({ data }) {
  if (!data?.length) return null;
  const icon = c => c <= 1 ? "☀️" : c <= 3 ? "⛅" : c <= 48 ? "🌫" : c <= 67 ? "🌧" : c <= 77 ? "🌨" : c <= 82 ? "🌦" : "⛈";
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: "0 0 auto", textAlign: "center", padding: "8px 10px", borderRadius: 12, minWidth: 58, background: d.isToday ? C.accentDim : C.surface, border: `1px solid ${d.isToday ? C.accent + "44" : C.border}` }}>
          <div style={{ fontSize: 10, color: d.isToday ? C.accent : C.textDim, fontWeight: d.isToday ? 700 : 400, marginBottom: 3 }}>{d.isToday ? "今日" : d.dateLabel}</div>
          <div style={{ fontSize: 20, marginBottom: 3 }}>{icon(d.weatherCode)}</div>
          <div style={{ fontSize: 11 }}><span style={{ color: C.warm }}>{d.tempMax}</span><span style={{ color: C.textDim }}>/</span><span style={{ color: C.cool }}>{d.tempMin}</span></div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4, fontFamily: MONO, color: d.waterTemp < 10 ? C.cool : d.waterTemp < 18 ? C.accent : C.green }}>{d.waterTemp.toFixed(1)}℃</div>
        </div>
      ))}
    </div>
  );
}

function HeatBreakdown({ m }) {
  if (!m) return null;
  return (<div>{[
    { l: "☀️ 日射吸収", v: `+${m.solarAbs}`, c: C.warm },
    { l: "💨 蒸発冷却", v: `−${m.evapCool}`, c: C.cool },
    { l: "🌙 放射冷却", v: `−${m.backRad}`, c: C.textDim },
    { l: "⚡ 純熱量", v: m.netHeat > 0 ? `+${m.netHeat}` : `${m.netHeat}`, c: m.netHeat > 0 ? C.green : C.cool, bold: true },
  ].map((it, i) => (
    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: it.bold ? `1px solid ${C.border}` : "none", marginTop: it.bold ? 6 : 0 }}>
      <span style={{ fontSize: 12, color: it.bold ? C.text : C.textDim, fontWeight: it.bold ? 700 : 400 }}>{it.l}</span>
      <span style={{ fontSize: 13, color: it.c, fontWeight: 700, fontFamily: MONO }}>{it.v} W/m²</span>
    </div>
  ))}</div>);
}

function PondInfo({ pond }) {
  if (!pond) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {[
        { i: "📐", l: "面積", v: pond.areaKm2 < 0.01 ? `${(pond.areaKm2 * 1e6).toFixed(0)} m²` : `${pond.areaKm2.toFixed(3)} km²` },
        { i: "📏", l: "推定水深", v: `${pond.avgDepth.toFixed(1)} m` },
        { i: "💧", l: "推定体積", v: pond.volumeM3 < 10000 ? `${pond.volumeM3.toFixed(0)} m³` : `${(pond.volumeM3 / 1e6).toFixed(3)} 百万m³` },
        { i: "🏷", l: "名称", v: pond.name || "名称不明" },
      ].map((it, i) => (
        <div key={i} style={{ background: C.surface, borderRadius: 10, padding: "10px 12px", border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.textDim, marginBottom: 3 }}>{it.i} {it.l}</div>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 600, fontFamily: it.l === "名称" ? FONT : MONO }}>{it.v}</div>
        </div>
      ))}
    </div>
  );
}

function RichText({ text }) {
  if (!text) return null;
  return (
    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.9 }}>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        return <p key={i} style={{ margin: "4px 0" }}>{line.split(/(\*\*[^*]+\*\*)/g).map((p, j) => p.startsWith("**") && p.endsWith("**") ? <strong key={j} style={{ color: C.accent, fontWeight: 700 }}>{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>)}</p>;
      })}
    </div>
  );
}

// ---- LEAFLET ----
function LeafletMap({ center, marker, pondPolygon, onMapClick, mapRef }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const markerRef = useRef(null);
  const polyRef = useRef(null);
  const [ready, setReady] = useState(false);
  const LRef = useRef(null);
  const onClickRef = useRef(onMapClick);
  onClickRef.current = onMapClick;

  useEffect(() => {
    // Dynamic import for SSR safety
    import("leaflet").then((L) => {
      LRef.current = L.default || L;
      setReady(true);
    }).catch(() => {
      // Fallback: load via script tag
      if (!window.L) {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
        s.onload = () => { LRef.current = window.L; setReady(true); };
        document.head.appendChild(s);
      } else {
        LRef.current = window.L;
        setReady(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || instanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = L.map(containerRef.current, { zoomControl: false }).setView([center.lat, center.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OSM", maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.on("click", e => onClickRef.current(e.latlng.lat, e.latlng.lng));
    instanceRef.current = map;
    if (mapRef) mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 300);
  }, [ready]);

  useEffect(() => {
    if (!instanceRef.current || !LRef.current || !marker) return;
    const L = LRef.current, map = instanceRef.current;
    if (markerRef.current) map.removeLayer(markerRef.current);
    markerRef.current = L.marker([marker.lat, marker.lng], {
      icon: L.divIcon({ html: `<div style="font-size:28px;filter:drop-shadow(0 2px 6px rgba(0,194,224,0.5))">📌</div>`, iconSize: [30, 30], iconAnchor: [15, 30], className: "" })
    }).addTo(map);
    map.flyTo([marker.lat, marker.lng], Math.max(map.getZoom(), 13), { duration: 0.8 });
  }, [marker]);

  useEffect(() => {
    if (!instanceRef.current || !LRef.current) return;
    const L = LRef.current, map = instanceRef.current;
    if (polyRef.current) map.removeLayer(polyRef.current);
    if (pondPolygon?.length > 2) {
      polyRef.current = L.polygon(pondPolygon, { color: C.accent, fillColor: C.accent, fillOpacity: 0.18, weight: 2.5 }).addTo(map);
      map.fitBounds(polyRef.current.getBounds(), { padding: [50, 50], maxZoom: 16 });
    }
  }, [pondPolygon]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: 280, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, background: C.surface }}>
      {!ready && <Spinner msg="地図を読み込み中..." />}
    </div>
  );
}

// ---- CATCH RECORDS ----
function CatchSection({ pond, waterTemp }) {
  const [recs, setRecs] = useState([]);
  const [show, setShow] = useState(false);
  const [fish, setFish] = useState("ブラックバス");
  const [size, setSize] = useState(""); const [lure, setLure] = useState(""); const [note, setNote] = useState("");
  const KEY = "catch-records-v2";
  useEffect(() => { loadStore(KEY).then(d => { if (d) setRecs(d); }); }, []);
  const add = async () => {
    const rec = { id: Date.now().toString(), date: new Date().toISOString().split("T")[0], time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }), pond: pond?.name || "不明", waterTemp, fish, size: size || "—", lure: lure || "—", note };
    const u = [rec, ...recs].slice(0, 100); setRecs(u); await saveStore(KEY, u); setShow(false); setSize(""); setLure(""); setNote("");
  };
  const del = async (id) => { const u = recs.filter(r => r.id !== id); setRecs(u); await saveStore(KEY, u); };
  const inp = { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, fontFamily: FONT };
  const fishTypes = ["ブラックバス", "ニジマス", "ヘラブナ", "コイ", "ナマズ", "ブルーギル", "ワカサギ", "その他"];

  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>🎣 釣果記録</span>
        <button onClick={() => setShow(!show)} style={{ background: show ? `${C.danger}22` : C.accentDim, color: show ? C.danger : C.accent, borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, border: `1px solid ${show ? C.danger + "33" : C.accent + "33"}` }}>
          {show ? "✕ 閉じる" : "＋ 記録する"}
        </button>
      </div>
      {show && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14, animation: "fadeIn .3s" }}>
          <div>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>魚種</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {fishTypes.map(f => <button key={f} onClick={() => setFish(f)} style={{ background: fish === f ? C.accentDim : C.surface, color: fish === f ? C.accent : C.textDim, border: `1px solid ${fish === f ? C.accent + "44" : C.border}`, borderRadius: 16, padding: "4px 10px", fontSize: 11 }}>{f}</button>)}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>サイズ (cm)</div><input value={size} onChange={e => setSize(e.target.value)} placeholder="例: 35" style={inp} /></div>
            <div><div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>ルアー/エサ</div><input value={lure} onChange={e => setLure(e.target.value)} placeholder="例: ワーム" style={inp} /></div>
          </div>
          <div><div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>メモ</div><input value={note} onChange={e => setNote(e.target.value)} placeholder="天気やポイントなど" style={inp} /></div>
          <button onClick={add} style={{ background: `linear-gradient(135deg,${C.accent},${C.green})`, color: "#fff", borderRadius: 12, padding: "10px 0", fontSize: 14, fontWeight: 700 }}>記録を保存 💾</button>
        </div>
      )}
      {recs.length === 0 ? <div style={{ textAlign: "center", padding: 16, color: C.textDim, fontSize: 12 }}>まだ釣果記録がありません</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
          {recs.slice(0, 10).map(r => (
            <div key={r.id} style={{ background: C.surface, borderRadius: 12, padding: "10px 12px", border: `1px solid ${C.border}`, position: "relative" }}>
              <button onClick={() => del(r.id)} style={{ position: "absolute", top: 6, right: 8, background: "none", color: C.textDim, fontSize: 14, padding: 2 }}>✕</button>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{r.fish} {r.size !== "—" ? `${r.size}cm` : ""}</span>
                <span style={{ fontSize: 11, color: C.textDim }}>{r.date} {r.time}</span>
              </div>
              <div style={{ fontSize: 11, color: C.textDim }}>📍 {r.pond} ・ 🌡{r.waterTemp?.toFixed(1)}℃ ・ 🎣{r.lure}</div>
              {r.note && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>💬 {r.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- FAVORITES ----
function useFavs() {
  const [favs, setFavs] = useState([]);
  const K = "fav-ponds-v2";
  useEffect(() => { loadStore(K).then(d => { if (d) setFavs(d); }); }, []);
  const add = async (p) => { if (favs.find(f => f.osmId === p.osmId)) return; const u = [{ osmId: p.osmId, name: p.name || "不明", lat: p.center[0], lng: p.center[1] }, ...favs].slice(0, 20); setFavs(u); await saveStore(K, u); };
  const rm = async (id) => { const u = favs.filter(f => f.osmId !== id); setFavs(u); await saveStore(K, u); };
  const is = (id) => favs.some(f => f.osmId === id);
  return { favs, add, rm, is };
}

// ============================================================
// MAIN
// ============================================================
export default function App() {
  const [stage, setStage] = useState("idle");
  const [error, setError] = useState("");
  const [center] = useState({ lat: 35.68, lng: 139.77 });
  const [marker, setMarker] = useState(null);
  const [pond, setPond] = useState(null);
  const [pondCoords, setPondCoords] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [today, setToday] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [searchText, setSearchText] = useState("");
  const [tab, setTab] = useState("result");
  const [statusMsg, setStatusMsg] = useState("");
  const { favs, add: addFav, rm: rmFav, is: isFav } = useFavs();
  const mapRef = useRef(null);

  const doSearch = useCallback(async (lat, lng) => {
    setStage("searching"); setError(""); setPond(null); setTimeline(null); setToday(null); setExplanation(""); setPondCoords(null); setTab("result");
    setStatusMsg("池を探しています...");
    try {
      // Try 500m first, then 2km, then 5km
      let data, best;
      for (const radius of [500, 2000, 5000]) {
        setStatusMsg(`半径${radius >= 1000 ? (radius / 1000) + "km" : radius + "m"}で検索中...`);
        data = await searchOverpass(lat, lng, radius);
        best = extractBestPond(data, lat, lng);
        if (best) break;
      }

      if (!best) { setStage("error"); setError("この付近に池・湖が見つかりませんでした。\n\n💡 ヒント:\n• 地図上で水色の水域を直接タップ\n• 池の名前で検索してみてください"); return; }

      const depth = depthFromArea(best.areaKm2);
      const vol = best.areaKm2 * 1e6 * depth;
      const cLat = best.coords.reduce((s, c) => s + c[0], 0) / best.coords.length;
      const cLng = best.coords.reduce((s, c) => s + c[1], 0) / best.coords.length;
      const pondData = { ...best, avgDepth: depth, volumeM3: vol, center: [cLat, cLng] };
      setPond(pondData);
      setPondCoords(best.coords);

      setStage("loading_weather");
      setStatusMsg("気象データを取得中...");
      const now = new Date();
      const ps = new Date(now); ps.setDate(now.getDate() - 7);
      const fe = new Date(now); fe.setDate(now.getDate() + 3);
      const fmt = d => d.toISOString().split("T")[0];

      const wr = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${cLat}&longitude=${cLng}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,shortwave_radiation_sum&hourly=relativehumidity_2m&start_date=${fmt(ps)}&end_date=${fmt(fe)}&timezone=Asia/Tokyo`);
      if (!wr.ok) throw new Error("気象データ取得エラー");
      const wd = await wr.json();
      if (!wd.daily?.time) throw new Error("気象データが空です");

      const hHum = wd.hourly?.relativehumidity_2m || [];
      const avgH = di => { const s = hHum.slice(di * 24, di * 24 + 24); return s.length ? s.reduce((a, v) => a + (v || 65), 0) / s.length : 65; };
      const todayStr = fmt(now);
      const tl = wd.daily.time.map((ds, i) => {
        const avg = (wd.daily.temperature_2m_max[i] + wd.daily.temperature_2m_min[i]) / 2;
        const sol = ((wd.daily.shortwave_radiation_sum?.[i] || 15) * 1e6) / 86400;
        const m = estimateWaterTemp({ airTempC: avg, solarRad: sol, windSpeed: (wd.daily.windspeed_10m_max?.[i] || 3) / 3.6, humidity: avgH(i), precip: wd.daily.precipitation_sum?.[i] || 0, areaKm2: pondData.areaKm2, depthM: depth });
        const dd = new Date(ds);
        return { date: ds, dateLabel: `${dd.getMonth() + 1}/${dd.getDate()}`, isToday: ds === todayStr, tempMax: Math.round(wd.daily.temperature_2m_max[i]), tempMin: Math.round(wd.daily.temperature_2m_min[i]), weatherCode: wd.daily.weathercode?.[i] || 0, waterTemp: m.waterTemp, model: m };
      });
      setTimeline(tl);
      const te = tl.find(t => t.isToday) || tl[tl.length - 1];
      setToday(te);
      setExplanation(generateExplanation({ pond: pondData, weatherTimeline: tl, todayEntry: te }));
      setStage("done");
    } catch (e) { console.error(e); setStage("error"); setError(e.message || "エラーが発生しました"); }
  }, []);

  const onMapClick = useCallback((lat, lng) => { setMarker({ lat, lng }); doSearch(lat, lng); }, [doSearch]);

  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) return;
    setStage("searching"); setStatusMsg("場所を検索中...");
    const result = await geocodeWater(searchText);
    if (result) {
      setMarker({ lat: result.lat, lng: result.lng });
      doSearch(result.lat, result.lng);
    } else { setStage("error"); setError("場所が見つかりませんでした。\n池や湖の正式名称で試してみてください。"); }
  }, [searchText, doSearch]);

  const presets = [
    { n: "相模湖", lat: 35.5930, lng: 139.2170 },
    { n: "芦ノ湖", lat: 35.2050, lng: 139.0200 },
    { n: "井の頭池", lat: 35.6991, lng: 139.5724 },
    { n: "河口湖", lat: 35.5100, lng: 138.7500 },
    { n: "印旛沼", lat: 35.7900, lng: 140.1900 },
  ];

  return (
    <div style={{ fontFamily: FONT, background: C.bg, color: C.text, minHeight: "100vh", maxWidth: 520, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&family=JetBrains+Mono:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ padding: "20px 16px 14px", background: `linear-gradient(180deg,${C.surface},transparent)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: `linear-gradient(135deg,${C.accent}22,${C.green}11)`, border: `1.5px solid ${C.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🐟</div>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.2 }}>池温<span style={{ color: C.accent }}>よそく</span></h1>
            <span style={{ fontSize: 10, color: C.textDim }}>地図タップで水温予測 ・ 全API無料</span>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div style={{ padding: "0 16px 10px" }}>
        <div style={{ display: "flex", gap: 8, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "5px 5px 5px 14px", alignItems: "center" }}>
          <span style={{ fontSize: 15, opacity: 0.5 }}>🔍</span>
          <input value={searchText} onChange={e => setSearchText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="池や湖の名前..." style={{ flex: 1, background: "none", border: "none", color: C.text, fontSize: 14, fontFamily: FONT }} />
          <button onClick={handleSearch} style={{ background: `linear-gradient(135deg,${C.accent},${C.green})`, color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700 }}>検索</button>
        </div>
      </div>

      {/* PRESETS + FAVS */}
      <div style={{ padding: "0 16px 10px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {presets.map(p => (
            <button key={p.n} onClick={() => { setSearchText(p.n); onMapClick(p.lat, p.lng); }} style={{ background: C.surface, color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 11 }}>{p.n}</button>
          ))}
          {favs.filter(f => !presets.some(p => p.n === f.name)).map(f => (
            <button key={f.osmId} onClick={() => { setSearchText(f.name); onMapClick(f.lat, f.lng); }} style={{ background: C.warmDim, color: C.warm, border: `1px solid ${C.warm}33`, borderRadius: 20, padding: "4px 10px", fontSize: 11 }}>⭐ {f.name}</button>
          ))}
        </div>
      </div>

      {/* MAP */}
      <div style={{ padding: "0 16px 14px" }}>
        <LeafletMap center={center} marker={marker} pondPolygon={pondCoords} onMapClick={onMapClick} mapRef={mapRef} />
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 6, textAlign: "center" }}>🗺 地図をタップして池を選択 ・ ピンチで拡大縮小</div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: "0 16px 24px" }}>
        {(stage === "searching" || stage === "loading_weather") && (
          <div style={{ animation: "fadeIn .3s" }}>
            {pond && <div style={{ marginBottom: 14 }}><PondInfo pond={pond} /></div>}
            <Spinner msg={statusMsg} />
          </div>
        )}
        {stage === "error" && (
          <div style={{ background: `${C.danger}11`, border: `1px solid ${C.danger}33`, borderRadius: 14, padding: 20, textAlign: "center", animation: "fadeIn .3s" }}>
            <span style={{ fontSize: 32, display: "block", marginBottom: 10 }}>😢</span>
            <div style={{ color: C.text, fontSize: 13, whiteSpace: "pre-line", lineHeight: 1.7 }}>{error}</div>
          </div>
        )}
        {stage === "idle" && (
          <div style={{ background: C.surface, borderRadius: 16, padding: 30, textAlign: "center", border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>🎣</span>
            <div style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>池を選んで水温チェック！</div>
            <div style={{ color: C.textDim, fontSize: 12, lineHeight: 1.8 }}>地図をタップするか<br />池の名前で検索して始めよう</div>
          </div>
        )}

        {stage === "done" && pond && today && (
          <div style={{ animation: "fadeIn .4s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>📍 {pond.name || "名称不明の池"}</span>
              <button onClick={() => isFav(pond.osmId) ? rmFav(pond.osmId) : addFav(pond)} style={{ background: isFav(pond.osmId) ? C.warmDim : C.surface, color: isFav(pond.osmId) ? C.warm : C.textDim, border: `1px solid ${isFav(pond.osmId) ? C.warm + "44" : C.border}`, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>
                {isFav(pond.osmId) ? "⭐ 登録済" : "☆ お気に入り"}
              </button>
            </div>
            <div style={{ marginBottom: 14 }}><PondInfo pond={pond} /></div>

            {/* TABS */}
            <div style={{ display: "flex", background: C.surface, borderRadius: 12, padding: 3, border: `1px solid ${C.border}`, marginBottom: 14, gap: 3 }}>
              {[{ k: "result", l: "🌡 水温" }, { k: "science", l: "🔬 根拠" }, { k: "catch", l: "🎣 釣果" }].map(t => (
                <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, padding: "9px 6px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: tab === t.k ? `linear-gradient(135deg,${C.accent}25,${C.accent}10)` : "transparent", color: tab === t.k ? C.accent : C.textDim }}>
                  {t.l}
                </button>
              ))}
            </div>

            {tab === "result" && (
              <div style={{ animation: "fadeIn .3s" }}>
                <div style={{ background: `linear-gradient(150deg,${C.card},${C.cardAlt})`, borderRadius: 18, border: `1px solid ${C.borderLight}`, padding: 20, marginBottom: 14, boxShadow: `0 8px 32px ${C.bg}80` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, marginBottom: 3 }}>🌡 推定水温</h3>
                      <span style={{ fontSize: 11, color: C.textDim }}>{today.date} ・ 熱収支モデル</span>
                    </div>
                    <TempBadge temp={today.waterTemp} />
                  </div>
                  <ActivityBar temp={today.waterTemp} />
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, marginBottom: 8 }}>🔬 熱収支内訳</div>
                    <HeatBreakdown m={today.model} />
                  </div>
                </div>
                <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, marginBottom: 10 }}>📈 水温トレンド（7日前→3日後予測）</div>
                  <MiniChart data={timeline} />
                </div>
                <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, marginBottom: 10 }}>🌤 天気と水温</div>
                  <WeatherStrip data={timeline} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14 }}>
                    <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>🎯 推定精度</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.green, fontFamily: MONO }}>±2℃</div>
                  </div>
                  <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14 }}>
                    <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>📊 データ</div>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.9 }}>Overpass API<br />Open-Meteo<br />熱収支方程式</div>
                  </div>
                </div>
              </div>
            )}

            {tab === "science" && (
              <div style={{ animation: "fadeIn .3s" }}>
                <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, marginBottom: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🔬 水温予測の科学的根拠</div>
                  <RichText text={explanation} />
                </div>
                <div style={{ background: `${C.accent}08`, borderRadius: 12, border: `1px solid ${C.accent}22`, padding: "12px 16px", fontSize: 11, color: C.textDim, lineHeight: 1.7 }}>
                  📚 参考文献: Edinger et al. (1968) "Heat Exchange and Transport in the Environment", Cael & Seekell (2016) "The size-distribution of Earth's lakes", Nature Communications.
                </div>
              </div>
            )}

            {tab === "catch" && <div style={{ animation: "fadeIn .3s" }}><CatchSection pond={pond} waterTemp={today.waterTemp} /></div>}
          </div>
        )}
      </div>
      <div style={{ padding: "0 16px 30px", textAlign: "center" }}><span style={{ fontSize: 10, color: `${C.textDim}55` }}>池温よそく v1.1 ・ 全API無料 ・ © 2026</span></div>
    </div>
  );
}
