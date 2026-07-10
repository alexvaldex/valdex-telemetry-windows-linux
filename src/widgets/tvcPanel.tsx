import type { TelemetryFrameV1 } from "../telemetry/types";
import { tiltDegFromQuat } from "../telemetry/attitude";

/**
 * TVC (thrust vector control) test panel.
 *
 * Built for static gimbal bench tests and powered flight alike: shows where the
 * motor is actually pointing, how hard the controller is working, and whether
 * the servos are keeping up with (or saturating against) the commanded angle.
 *
 * Commanded angles come from `tvc_pitch_deg` / `tvc_yaw_deg`. When the hardware
 * reports servo feedback (`tvc_*_fb_deg`) the panel also shows tracking error —
 * the single most useful number when tuning a gimbal loop.
 */

/** Mechanical deflection limit of a typical hobby TVC mount, in degrees. */
const GIMBAL_LIMIT_DEG = 10;
/** Deflection beyond this fraction of the limit counts as saturated. */
const SATURATION_FRAC = 0.9;

function clampDeg(d: number): number {
  return Math.max(-GIMBAL_LIMIT_DEG, Math.min(GIMBAL_LIMIT_DEG, d));
}

/** Root-mean-square of a numeric series — the standard "how big is the error" metric. */
function rms(values: number[]): number | null {
  if (!values.length) return null;
  const sum = values.reduce((a, v) => a + v * v, 0);
  return Math.sqrt(sum / values.length);
}

export function TvcPanelWidget(props: { frames: TelemetryFrameV1[]; latest?: TelemetryFrameV1 }) {
  const { latest, frames } = props;

  const pitchCmd = typeof latest?.tvc_pitch_deg === "number" ? latest.tvc_pitch_deg : null;
  const yawCmd = typeof latest?.tvc_yaw_deg === "number" ? latest.tvc_yaw_deg : null;
  const pitchFb = typeof latest?.tvc_pitch_fb_deg === "number" ? latest.tvc_pitch_fb_deg : null;
  const yawFb = typeof latest?.tvc_yaw_fb_deg === "number" ? latest.tvc_yaw_fb_deg : null;
  const enabled = latest?.tvc_enabled === 1;

  const hasFeedback = pitchFb !== null || yawFb !== null;

  // Total deflection magnitude — the vector sum, which is what the mount limit
  // actually constrains (not each axis independently).
  const deflection =
    pitchCmd !== null && yawCmd !== null ? Math.sqrt(pitchCmd * pitchCmd + yawCmd * yawCmd) : null;
  const saturated = deflection !== null && deflection >= GIMBAL_LIMIT_DEG * SATURATION_FRAC;

  // Tracking error over the recent window: how far the servos lag the command.
  const recent = frames.slice(-120);
  const pitchErrs = recent
    .filter((f) => typeof f.tvc_pitch_deg === "number" && typeof f.tvc_pitch_fb_deg === "number")
    .map((f) => (f.tvc_pitch_deg as number) - (f.tvc_pitch_fb_deg as number));
  const yawErrs = recent
    .filter((f) => typeof f.tvc_yaw_deg === "number" && typeof f.tvc_yaw_fb_deg === "number")
    .map((f) => (f.tvc_yaw_deg as number) - (f.tvc_yaw_fb_deg as number));
  const pitchRms = rms(pitchErrs);
  const yawRms = rms(yawErrs);

  // Vehicle tilt off vertical — what the gimbal is fighting.
  const tilt = tiltDegFromQuat(latest?.q_w, latest?.q_x, latest?.q_y, latest?.q_z);

  // Deflection trail — last N commanded positions, drawn faint behind the marker.
  const trail = frames
    .slice(-60)
    .filter((f) => typeof f.tvc_pitch_deg === "number" && typeof f.tvc_yaw_deg === "number")
    .map((f) => ({ p: clampDeg(f.tvc_pitch_deg as number), y: clampDeg(f.tvc_yaw_deg as number) }));

  if (pitchCmd === null && yawCmd === null) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100%", textAlign: "center", padding: 16 }}>
        <div>
          <div className="vx-label" style={{ marginBottom: 8 }}>No TVC Telemetry</div>
          <div style={{ fontSize: 12, color: "var(--vx-fg-faint)", lineHeight: 1.6, maxWidth: 260 }}>
            Send <code>tvc_pitch_deg</code> and <code>tvc_yaw_deg</code> to drive this panel.
            Add <code>tvc_pitch_fb_deg</code> / <code>tvc_yaw_fb_deg</code> for servo tracking error.
          </div>
        </div>
      </div>
    );
  }

  // SVG target: 100x100 viewBox, center 50,50, radius 42 == GIMBAL_LIMIT_DEG.
  const R = 42;
  const toXY = (pitch: number, yaw: number) => ({
    x: 50 + (clampDeg(yaw) / GIMBAL_LIMIT_DEG) * R,
    y: 50 - (clampDeg(pitch) / GIMBAL_LIMIT_DEG) * R,
  });
  const cmdPt = toXY(pitchCmd ?? 0, yawCmd ?? 0);
  const fbPt = hasFeedback ? toXY(pitchFb ?? 0, yawFb ?? 0) : null;

  const statusColor = !enabled
    ? "var(--vx-fg-faint)"
    : saturated
    ? "var(--vx-crit)"
    : "var(--vx-go)";
  const statusText = !enabled ? "DISARMED" : saturated ? "SATURATED" : "ACTIVE";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div className="vx-label">Gimbal Deflection</div>
        <span
          className="vx-chip"
          style={{ borderColor: statusColor, color: statusColor }}
          title={saturated ? "Commanded deflection is at the mechanical limit" : "TVC controller state"}
        >
          {statusText}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,160px)", gap: 12, flex: 1, minHeight: 0 }}>
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", maxHeight: 260, minHeight: 0 }} role="img" aria-label="Gimbal deflection target">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--vx-line)" strokeWidth="0.6" />
          <circle cx="50" cy="50" r={R * SATURATION_FRAC} fill="none" stroke="var(--vx-caution)" strokeWidth="0.4" strokeDasharray="2 2" opacity="0.5" />
          <circle cx="50" cy="50" r={R / 2} fill="none" stroke="var(--vx-line)" strokeWidth="0.4" opacity="0.6" />
          <line x1={50 - R} y1="50" x2={50 + R} y2="50" stroke="var(--vx-line)" strokeWidth="0.4" />
          <line x1="50" y1={50 - R} x2="50" y2={50 + R} stroke="var(--vx-line)" strokeWidth="0.4" />

          {trail.map((t, i) => {
            const pt = toXY(t.p, t.y);
            return <circle key={i} cx={pt.x} cy={pt.y} r="0.7" fill="var(--vx-accent)" opacity={(i / trail.length) * 0.35} />;
          })}

          {fbPt && (
            <>
              <line x1={cmdPt.x} y1={cmdPt.y} x2={fbPt.x} y2={fbPt.y} stroke="var(--vx-crit)" strokeWidth="0.5" opacity="0.7" />
              <circle cx={fbPt.x} cy={fbPt.y} r="2" fill="none" stroke="var(--vx-caution)" strokeWidth="0.8" />
            </>
          )}

          <line x1="50" y1="50" x2={cmdPt.x} y2={cmdPt.y} stroke="var(--vx-accent)" strokeWidth="0.6" opacity="0.8" />
          <circle cx={cmdPt.x} cy={cmdPt.y} r="2.4" fill={saturated ? "var(--vx-crit)" : "var(--vx-accent-bright)"} />

          <text x="50" y="5" textAnchor="middle" fontSize="4" fill="var(--vx-fg-faint)">+PITCH</text>
          <text x="96" y="51.5" textAnchor="end" fontSize="4" fill="var(--vx-fg-faint)">+YAW</text>
          <text x="50" y="99" textAnchor="middle" fontSize="3.4" fill="var(--vx-fg-faint)">±{GIMBAL_LIMIT_DEG}° limit</text>
        </svg>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0, overflow: "auto" }}>
          <AxisRow label="Pitch" cmd={pitchCmd} fb={pitchFb} />
          <AxisRow label="Yaw" cmd={yawCmd} fb={yawFb} />

          <Stat
            label="Deflection"
            value={deflection !== null ? `${deflection.toFixed(2)}°` : "—"}
            color={saturated ? "var(--vx-crit)" : undefined}
            title="Vector sum of pitch and yaw — this is what the mechanical limit constrains"
          />
          {tilt !== null && (
            <Stat label="Vehicle tilt" value={`${tilt.toFixed(1)}°`} title="Angle off vertical — what the gimbal is correcting" />
          )}
          {hasFeedback && (
            <>
              <Stat
                label="Pitch err (RMS)"
                value={pitchRms !== null ? `${pitchRms.toFixed(2)}°` : "—"}
                title="Root-mean-square tracking error over the last ~120 frames"
              />
              <Stat
                label="Yaw err (RMS)"
                value={yawRms !== null ? `${yawRms.toFixed(2)}°` : "—"}
                title="Root-mean-square tracking error over the last ~120 frames"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AxisRow(props: { label: string; cmd: number | null; fb: number | null }) {
  const { cmd, fb } = props;
  const pct = cmd !== null ? (clampDeg(cmd) / GIMBAL_LIMIT_DEG) * 50 : 0;
  const fbPct = fb !== null ? (clampDeg(fb) / GIMBAL_LIMIT_DEG) * 50 : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
        <span className="vx-label" style={{ fontSize: 10 }}>{props.label}</span>
        <span className="vx-num" style={{ fontSize: 13, color: "var(--vx-fg)" }}>
          {cmd !== null ? `${cmd >= 0 ? "+" : ""}${cmd.toFixed(2)}°` : "—"}
        </span>
      </div>
      <div style={{ position: "relative", height: 8, marginTop: 4, background: "rgba(20,20,23,0.9)", border: "1px solid var(--vx-line)", borderRadius: 2 }}>
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--vx-line-strong)" }} />
        {fbPct !== null && (
          <div
            title="Servo feedback (actual)"
            style={{ position: "absolute", left: `calc(50% + ${fbPct}%)`, top: -2, bottom: -2, width: 2, background: "var(--vx-caution)", transform: "translateX(-1px)" }}
          />
        )}
        <div
          title="Commanded"
          style={{
            position: "absolute",
            left: pct >= 0 ? "50%" : `calc(50% + ${pct}%)`,
            width: `${Math.abs(pct)}%`,
            top: 1,
            bottom: 1,
            background: "var(--vx-accent)",
          }}
        />
      </div>
    </div>
  );
}

function Stat(props: { label: string; value: string; color?: string; title?: string }) {
  return (
    <div
      title={props.title}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6, borderTop: "1px solid var(--vx-line)", paddingTop: 6 }}
    >
      <span className="vx-label" style={{ fontSize: 10 }}>{props.label}</span>
      <span className="vx-num" style={{ fontSize: 13, color: props.color ?? "var(--vx-fg)" }}>{props.value}</span>
    </div>
  );
}
