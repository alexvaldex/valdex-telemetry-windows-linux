import React, { useMemo } from "react";
import type { TelemetryFrameV1 } from "../telemetry/types";
import type { UnitSystem } from "../units";

const M_PER_DEG_LAT = 111_320;
const M_TO_FT = 3.280839895;

type Pt = { e: number; n: number }; // meters east/north of pad

/**
 * Offline "range map": projects the GPS track into local meters around the pad
 * and draws it as SVG. No map tiles required — usable on a launch range with no
 * internet. Shows pad, flight track, current/last-known position, and the
 * bearing + distance a recovery crew needs to walk out to the rocket.
 */
export function RangeMapWidget(props: { frames: TelemetryFrameV1[]; latest?: TelemetryFrameV1; unitSystem: UnitSystem }) {
  const imperial = props.unitSystem === "imperial";

  const model = useMemo(() => {
    const fixes = props.frames.filter(
      (f) => typeof f.lat === "number" && typeof f.lon === "number"
    );
    if (!fixes.length) return null;

    const pad = fixes[0];
    const lat0 = pad.lat as number;
    const lon0 = pad.lon as number;
    const mPerDegLon = M_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180);

    const pts: Pt[] = fixes.map((f) => ({
      e: ((f.lon as number) - lon0) * mPerDegLon,
      n: ((f.lat as number) - lat0) * M_PER_DEG_LAT,
    }));

    const last = pts[pts.length - 1];
    const distM = Math.sqrt(last.e * last.e + last.n * last.n);
    // Bearing from pad to current, clockwise from North.
    let bearing = (Math.atan2(last.e, last.n) * 180) / Math.PI;
    if (bearing < 0) bearing += 360;

    let maxR = 10;
    for (const p of pts) maxR = Math.max(maxR, Math.abs(p.e), Math.abs(p.n));
    maxR *= 1.15;

    return { pts, last, distM, bearing, maxR };
  }, [props.frames]);

  const size = 260;
  const c = size / 2;

  if (!model) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--vx-fg-faint)" }}>
        <div className="vx-label">Awaiting GPS fix…</div>
      </div>
    );
  }

  const scale = (c - 18) / model.maxR;
  const px = (p: Pt) => ({ x: c + p.e * scale, y: c - p.n * scale });
  const path = model.pts.map((p, i) => { const q = px(p); return `${i === 0 ? "M" : "L"} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`; }).join(" ");
  const cur = px(model.last);

  const distDisp = imperial ? `${(model.distM * M_TO_FT).toFixed(0)} ft` : `${model.distM.toFixed(0)} m`;
  const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(model.bearing / 45) % 8];

  // range rings at nice intervals
  const ringM = niceRing(model.maxR);
  const rings: number[] = [];
  for (let r = ringM; r <= model.maxR; r += ringM) rings.push(r);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, height: "100%", alignItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ background: "rgba(4,7,14,0.6)", border: "1px solid var(--vx-line)", borderRadius: 3 }}>
        {/* range rings */}
        {rings.map((r, i) => (
          <circle key={i} cx={c} cy={c} r={r * scale} fill="none" stroke="var(--vx-line)" strokeWidth={1} />
        ))}
        {/* crosshair */}
        <line x1={c} y1={8} x2={c} y2={size - 8} stroke="var(--vx-line)" strokeWidth={1} />
        <line x1={8} y1={c} x2={size - 8} y2={c} stroke="var(--vx-line)" strokeWidth={1} />
        <text x={c + 4} y={16} fontSize={11} fill="var(--vx-fg-dim)" fontFamily="var(--vx-font-mono)">N</text>

        {/* track */}
        <path d={path} fill="none" stroke="var(--vx-blue-bright)" strokeWidth={2} strokeLinejoin="round" opacity={0.9} />

        {/* pad marker */}
        <g>
          <circle cx={c} cy={c} r={4} fill="var(--vx-go)" />
          <text x={c + 7} y={c + 4} fontSize={10} fill="var(--vx-go)" fontFamily="var(--vx-font-mono)">PAD</text>
        </g>

        {/* current position */}
        <g>
          <circle cx={cur.x} cy={cur.y} r={5} fill="var(--vx-caution)" stroke="#000" strokeWidth={0.5} />
          <circle cx={cur.x} cy={cur.y} r={9} fill="none" stroke="var(--vx-caution)" strokeWidth={1} opacity={0.5} />
        </g>
      </svg>

      <div style={{ display: "grid", gap: 12, alignContent: "center" }}>
        <div>
          <div className="vx-label">Recovery Bearing</div>
          <div style={{ fontFamily: "var(--vx-font-mono)", fontWeight: 800, fontSize: 30, color: "var(--vx-caution)" }}>
            {model.bearing.toFixed(0)}° <span style={{ fontSize: 16, color: "var(--vx-fg-dim)" }}>{compass}</span>
          </div>
        </div>
        <div>
          <div className="vx-label">Distance from Pad</div>
          <div style={{ fontFamily: "var(--vx-font-mono)", fontWeight: 800, fontSize: 30, color: "var(--vx-fg)" }}>{distDisp}</div>
        </div>
        <div style={{ fontFamily: "var(--vx-font-mono)", fontSize: 11, color: "var(--vx-fg-dim)" }}>
          {(props.latest?.lat ?? model.pts.length) && typeof props.latest?.lat === "number"
            ? `${props.latest!.lat!.toFixed(5)}, ${props.latest!.lon!.toFixed(5)}`
            : ""}
        </div>
        <div className="vx-label" style={{ fontSize: 9 }}>Ring = {ringM >= 1000 ? `${(ringM / 1000).toFixed(1)} km` : `${ringM} m`}</div>
      </div>
    </div>
  );
}

function niceRing(maxR: number): number {
  const target = maxR / 3;
  const pow = Math.pow(10, Math.floor(Math.log10(target)));
  const candidates = [1, 2, 5, 10].map((m) => m * pow);
  return candidates.find((c) => c >= target) ?? candidates[candidates.length - 1];
}
