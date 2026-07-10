import React, { useMemo } from "react";
import type { TelemetryFrameV1 } from "../telemetry/types";

/**
 * Range-safety panel: pyro continuity (drogue / main), armed state, and a
 * master caution. Continuity is read from pyro_drogue_cont / pyro_main_cont
 * (1 = charge present / circuit continuous, 0 = open / fired). Armed state is
 * inferred from ARM events in the telemetry stream.
 */
export function PyroPanelWidget(props: { frames: TelemetryFrameV1[]; latest?: TelemetryFrameV1 }) {
  const armed = useMemo(() => {
    // Latest ARM/DISARM event wins.
    let state = false;
    for (const f of props.frames) {
      const ev = typeof f.event === "string" ? f.event.toUpperCase() : "";
      if (!ev) continue;
      if (ev.includes("DISARM")) state = false;
      else if (ev.includes("ARM")) state = true;
    }
    return state;
  }, [props.frames]);

  const hasFlown = useMemo(
    () => props.frames.some((f) => typeof f.event === "string" && /APOG|DROG|MAIN|LAND/i.test(f.event)),
    [props.frames]
  );

  const drogue = props.latest?.pyro_drogue_cont;
  const main = props.latest?.pyro_main_cont;

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto auto 1fr", gap: 12, height: "100%" }}>
      {/* Master status */}
      <MasterBanner armed={armed} drogue={drogue} main={main} hasFlown={hasFlown} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <PyroChannel label="DROGUE" cont={drogue} armed={armed} hasFlown={hasFlown} />
        <PyroChannel label="MAIN" cont={main} armed={armed} hasFlown={hasFlown} />
      </div>

      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <div className="vx-label" style={{ fontSize: 9, lineHeight: 1.6 }}>
          Continuity from pyro_drogue_cont / pyro_main_cont · Armed from ARM events.
          After deployment a fired channel reads OPEN — this is expected.
        </div>
      </div>
    </div>
  );
}

function stateColor(s: "go" | "caution" | "crit" | "nodata") {
  return s === "go" ? "var(--vx-go)" : s === "caution" ? "var(--vx-caution)" : s === "crit" ? "var(--vx-crit)" : "var(--vx-fg-faint)";
}

function MasterBanner(props: { armed: boolean; drogue?: 0 | 1; main?: 0 | 1; hasFlown: boolean }) {
  let label: string;
  let s: "go" | "caution" | "crit" | "nodata";

  const haveData = props.drogue !== undefined || props.main !== undefined;
  const anyOpen = props.drogue === 0 || props.main === 0;

  if (!haveData) { s = "nodata"; label = "NO PYRO DATA"; }
  else if (props.armed && !props.hasFlown && anyOpen) { s = "crit"; label = "MASTER CAUTION — CHANNEL OPEN"; }
  else if (props.armed && !props.hasFlown) { s = "caution"; label = "ARMED — LIVE"; }
  else if (props.armed && props.hasFlown) { s = "caution"; label = "ARMED — DEPLOYED"; }
  else { s = "go"; label = "SAFE"; }

  const col = stateColor(s);
  return (
    <div
      style={{
        border: `1px solid ${col}`,
        borderLeftWidth: 4,
        borderRadius: 3,
        background: "rgba(20, 20, 23,0.7)",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span className="vx-dot" style={{ background: col, boxShadow: `0 0 8px ${col}` }} />
      <span style={{ fontFamily: "var(--vx-font-display)", fontWeight: 700, letterSpacing: "0.1em", fontSize: 14, color: col }}>
        {label}
      </span>
    </div>
  );
}

function PyroChannel(props: { label: string; cont?: 0 | 1; armed: boolean; hasFlown: boolean }) {
  let s: "go" | "caution" | "crit" | "nodata";
  let text: string;
  if (props.cont === undefined) { s = "nodata"; text = "—"; }
  else if (props.cont === 1) { s = "go"; text = "CONT"; }
  else if (props.hasFlown) { s = "caution"; text = "FIRED"; }
  else { s = props.armed ? "crit" : "caution"; text = "OPEN"; }

  const col = stateColor(s);
  return (
    <div style={{ border: "1px solid var(--vx-line)", borderRadius: 3, background: "rgba(20, 20, 23,0.5)", padding: 12, display: "grid", gap: 8 }}>
      <span className="vx-label" style={{ fontSize: 10 }}>{props.label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="vx-dot" style={{ width: 12, height: 12, background: col, boxShadow: `0 0 10px ${col}` }} />
        <span style={{ fontFamily: "var(--vx-font-mono)", fontWeight: 800, fontSize: 20, color: col }}>{text}</span>
      </div>
    </div>
  );
}
