import React, { useMemo } from "react";
import type { TelemetryFrameV1 } from "../telemetry/types";
import type { UnitSystem } from "../units";

const G0 = 9.80665;
const M_TO_FT = 3.280839895;
const MAIN_BAND_M = 300; // altitude below which "main" descent is assumed

type Summary = {
  apogeeM?: number;
  apogeeTms?: number;
  maxVelMps?: number;
  maxAccelG?: number;
  liftoffTms?: number;
  burnoutTms?: number;
  landingTms?: number;
  boostS?: number;
  coastS?: number;
  descentS?: number;
  totalS?: number;
  drogueRateMps?: number;
  mainRateMps?: number;
};

function median(xs: number[]): number | undefined {
  if (!xs.length) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export function computeFlightSummary(frames: TelemetryFrameV1[]): Summary {
  if (!frames.length) return {};

  const alt = frames.map((f) => (typeof f.alt_m === "number" ? f.alt_m : NaN));
  const baseIdx = alt.findIndex((a) => Number.isFinite(a));
  const baseline = baseIdx >= 0 ? alt[baseIdx] : 0;

  // Apogee
  let apogeeM = -Infinity, apogeeIdx = -1;
  for (let i = 0; i < alt.length; i++) {
    if (Number.isFinite(alt[i]) && alt[i] > apogeeM) { apogeeM = alt[i]; apogeeIdx = i; }
  }

  // Max velocity (burnout ~ where velocity peaks) and max accel
  let maxVel = -Infinity, burnoutIdx = -1, maxAccel = -Infinity;
  for (let i = 0; i < frames.length; i++) {
    const v = frames[i].vel_mps;
    if (typeof v === "number" && v > maxVel) { maxVel = v; burnoutIdx = i; }
    const { ax, ay, az } = frames[i];
    if (typeof ax === "number" && typeof ay === "number" && typeof az === "number") {
      const mag = Math.sqrt(ax * ax + ay * ay + az * az);
      if (mag > maxAccel) maxAccel = mag;
    }
  }

  // Liftoff: first frame climbing meaningfully above baseline
  let liftoffIdx = -1;
  for (let i = 0; i < alt.length; i++) {
    if (Number.isFinite(alt[i]) && alt[i] > baseline + 2) { liftoffIdx = i; break; }
  }

  // Landing: last frame back near baseline after apogee
  let landingIdx = -1;
  for (let i = alt.length - 1; i >= 0; i--) {
    if (Number.isFinite(alt[i]) && alt[i] < baseline + 3) { landingIdx = i; }
    else if (i <= apogeeIdx) break;
  }
  if (landingIdx <= apogeeIdx) landingIdx = alt.length - 1;

  const tOf = (i: number) => (i >= 0 && i < frames.length ? frames[i].t_ms : undefined);
  const liftoffTms = tOf(liftoffIdx);
  const burnoutTms = tOf(burnoutIdx);
  const apogeeTms = tOf(apogeeIdx);
  const landingTms = tOf(landingIdx);

  const secBetween = (a?: number, b?: number) =>
    typeof a === "number" && typeof b === "number" && b >= a ? (b - a) / 1000 : undefined;

  // Descent rates: median descent speed after apogee, split by altitude band.
  const drogueSpeeds: number[] = [];
  const mainSpeeds: number[] = [];
  for (let i = Math.max(apogeeIdx, 1); i < frames.length; i++) {
    const a = frames[i].alt_m;
    if (typeof a !== "number") continue;
    let descend: number | undefined;
    if (typeof frames[i].vel_mps === "number" && (frames[i].vel_mps as number) < 0) {
      descend = -(frames[i].vel_mps as number);
    } else {
      const pa = frames[i - 1].alt_m;
      const dt = (frames[i].t_ms - frames[i - 1].t_ms) / 1000;
      if (typeof pa === "number" && dt > 0) descend = (pa - a) / dt;
    }
    if (descend === undefined || descend <= 0) continue;
    if (a > MAIN_BAND_M) drogueSpeeds.push(descend);
    else mainSpeeds.push(descend);
  }

  return {
    apogeeM: Number.isFinite(apogeeM) ? apogeeM : undefined,
    apogeeTms,
    maxVelMps: Number.isFinite(maxVel) ? maxVel : undefined,
    maxAccelG: Number.isFinite(maxAccel) ? maxAccel / G0 : undefined,
    liftoffTms,
    burnoutTms,
    landingTms,
    boostS: secBetween(liftoffTms, burnoutTms),
    coastS: secBetween(burnoutTms, apogeeTms),
    descentS: secBetween(apogeeTms, landingTms),
    totalS: secBetween(liftoffTms, landingTms),
    drogueRateMps: median(drogueSpeeds),
    mainRateMps: median(mainSpeeds),
  };
}

function Row(props: { k: string; v: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderBottom: "1px solid var(--vx-line)" }}>
      <span className="vx-label" style={{ fontSize: 10 }}>{props.k}</span>
      <span style={{ fontFamily: "var(--vx-font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: props.big ? 20 : 15, color: props.accent ?? "var(--vx-fg)" }}>
        {props.v}
      </span>
    </div>
  );
}

export function FlightSummaryWidget(props: { frames: TelemetryFrameV1[]; unitSystem: UnitSystem }) {
  const s = useMemo(() => computeFlightSummary(props.frames), [props.frames]);
  const imperial = props.unitSystem === "imperial";
  const altU = imperial ? "ft" : "m";
  const velU = imperial ? "ft/s" : "m/s";
  const conv = (m?: number) => (typeof m === "number" ? (imperial ? m * M_TO_FT : m) : undefined);
  const num = (v?: number, d = 0, u = "") => (typeof v === "number" ? `${v.toFixed(d)}${u ? " " + u : ""}` : "—");

  function exportReport() {
    const lines = [
      "VX TELEMETRY — FLIGHT SUMMARY",
      `Generated: ${new Date().toISOString()}`,
      "",
      `Apogee:            ${num(conv(s.apogeeM), 0, altU)}`,
      `Max velocity:      ${num(conv(s.maxVelMps), 0, velU)}`,
      `Max acceleration:  ${num(s.maxAccelG, 1, "g")}`,
      `Boost time:        ${num(s.boostS, 2, "s")}`,
      `Coast to apogee:   ${num(s.coastS, 2, "s")}`,
      `Descent time:      ${num(s.descentS, 1, "s")}`,
      `Total flight time: ${num(s.totalS, 1, "s")}`,
      `Drogue descent:    ${num(conv(s.drogueRateMps), 1, velU)}`,
      `Main descent:      ${num(conv(s.mainRateMps), 1, velU)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vx_flight_summary_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasFlight = typeof s.apogeeM === "number";

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", gap: 10, height: "100%" }}>
      <Row k="APOGEE" v={num(conv(s.apogeeM), 0, altU)} accent="var(--vx-go)" big />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", alignContent: "start" }}>
        <Row k="MAX VELOCITY" v={num(conv(s.maxVelMps), 0, velU)} accent="var(--vx-blue-bright)" />
        <Row k="MAX ACCEL" v={num(s.maxAccelG, 1, "g")} accent="var(--vx-blue-bright)" />
        <Row k="BOOST" v={num(s.boostS, 2, "s")} />
        <Row k="COAST" v={num(s.coastS, 2, "s")} />
        <Row k="DESCENT" v={num(s.descentS, 1, "s")} />
        <Row k="TOTAL" v={num(s.totalS, 1, "s")} />
        <Row k="DROGUE RATE" v={num(conv(s.drogueRateMps), 1, velU)} accent="var(--vx-caution)" />
        <Row k="MAIN RATE" v={num(conv(s.mainRateMps), 1, velU)} accent="var(--vx-caution)" />
      </div>

      <button className="vx-btn vx-btn-primary" onClick={exportReport} disabled={!hasFlight} style={{ width: "100%" }}>
        Export Report
      </button>
    </div>
  );
}
