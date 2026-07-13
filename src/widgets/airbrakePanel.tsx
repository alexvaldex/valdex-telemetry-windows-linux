import type { TelemetryFrameV1 } from "../telemetry/types";

/**
 * Air brakes panel.
 *
 * Air brakes are deployable drag surfaces used to hit a target apogee — the
 * controller opens them during coast to bleed off excess energy. The two things
 * that matter on a bench test or an apogee-targeting flight: how far the brakes
 * are deployed, and whether the predicted apogee is converging on the target.
 *
 * Drive it with `airbrake_pct` (commanded 0–100), optionally `airbrake_fb_pct`
 * (actual position), and `airbrake_target_apogee_m` / `airbrake_pred_apogee_m`
 * for the apogee tracker.
 */

function clampPct(v: number): number {
  return Math.max(0, Math.min(100, v));
}

export function AirbrakePanelWidget(props: { frames: TelemetryFrameV1[]; latest?: TelemetryFrameV1; unitSystem: "metric" | "imperial" }) {
  const { latest, unitSystem } = props;

  const cmd = typeof latest?.airbrake_pct === "number" ? clampPct(latest.airbrake_pct) : null;
  const fb = typeof latest?.airbrake_fb_pct === "number" ? clampPct(latest.airbrake_fb_pct) : null;
  const target = typeof latest?.airbrake_target_apogee_m === "number" ? latest.airbrake_target_apogee_m : null;
  const pred = typeof latest?.airbrake_pred_apogee_m === "number" ? latest.airbrake_pred_apogee_m : null;
  const alt = typeof latest?.alt_m === "number" ? latest.alt_m : null;
  const enabled = latest?.airbrake_enabled === 1;

  if (cmd === null && fb === null) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100%", textAlign: "center", padding: 16 }}>
        <div>
          <div className="vx-label" style={{ marginBottom: 8 }}>No Air-Brake Telemetry</div>
          <div style={{ fontSize: 12, color: "var(--vx-fg-faint)", lineHeight: 1.6, maxWidth: 270 }}>
            Send <code>airbrake_pct</code> (0–100) to drive this panel. Add
            <code> airbrake_target_apogee_m</code> and <code>airbrake_pred_apogee_m</code> for the apogee tracker.
          </div>
        </div>
      </div>
    );
  }

  const deploy = cmd ?? fb ?? 0;
  const toU = (m: number) => (unitSystem === "imperial" ? m * 3.280839895 : m);
  const uLabel = unitSystem === "imperial" ? "ft" : "m";

  // Apogee error: predicted minus target. Positive = will overshoot (deploy more).
  const apogeeErr = target !== null && pred !== null ? pred - target : null;
  const onTarget = apogeeErr !== null && Math.abs(apogeeErr) < (unitSystem === "imperial" ? 15.24 : 15);

  const statusColor = !enabled ? "var(--vx-fg-faint)" : onTarget ? "var(--vx-go)" : "var(--vx-caution)";
  const statusText = !enabled ? "STOWED" : onTarget ? "ON TARGET" : "TRIMMING";

  // Deployment gauge: petals opening from a central body (viewBox 100x100).
  const petalAngles = [30, 90, 150, 210, 270, 330];
  const openFrac = deploy / 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div className="vx-label">Air Brakes</div>
        <span className="vx-chip" style={{ borderColor: statusColor, color: statusColor }} title="Air-brake controller state">
          {statusText}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,150px) minmax(0,1fr)", gap: 12, flex: 1, minHeight: 0 }}>
        {/* Deployment petals */}
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", maxHeight: 220, minHeight: 0 }} role="img" aria-label="Air-brake deployment">
          <circle cx="50" cy="50" r="12" fill="none" stroke="var(--vx-line-strong)" strokeWidth="1" />
          {petalAngles.map((deg, i) => {
            const a = (deg * Math.PI) / 180;
            const rIn = 12;
            const rOut = 12 + 26 * openFrac;
            const x1 = 50 + Math.cos(a) * rIn;
            const y1 = 50 + Math.sin(a) * rIn;
            const x2 = 50 + Math.cos(a) * rOut;
            const y2 = 50 + Math.sin(a) * rOut;
            const perp = a + Math.PI / 2;
            const w = 3.4;
            return (
              <polygon
                key={i}
                points={`${x1 + Math.cos(perp) * w},${y1 + Math.sin(perp) * w} ${x1 - Math.cos(perp) * w},${y1 - Math.sin(perp) * w} ${x2},${y2}`}
                fill={enabled ? "var(--vx-accent-bright)" : "var(--vx-fg-faint)"}
                opacity={0.35 + 0.6 * openFrac}
              />
            );
          })}
          <text x="50" y="53" textAnchor="middle" fontSize="9" fill="var(--vx-fg)" fontFamily="var(--vx-font-mono)" fontWeight="700">
            {deploy.toFixed(0)}%
          </text>
        </svg>

        {/* Deployment bars + apogee tracker */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0, overflow: "auto" }}>
          <Bar label="Commanded" pct={cmd} accent="var(--vx-accent)" />
          {fb !== null && <Bar label="Actual" pct={fb} accent="var(--vx-caution)" />}

          {target !== null && pred !== null && (
            <div style={{ borderTop: "1px solid var(--vx-line)", paddingTop: 8, marginTop: 2 }}>
              <div className="vx-label" style={{ fontSize: 10, marginBottom: 6 }}>Apogee tracker</div>
              <ApogeeTracker targetM={target} predM={pred} altM={alt} toU={toU} uLabel={uLabel} />
              <Stat
                label="Apogee error"
                value={apogeeErr !== null ? `${apogeeErr >= 0 ? "+" : ""}${toU(apogeeErr).toFixed(0)} ${uLabel}` : "—"}
                color={onTarget ? "var(--vx-go)" : apogeeErr !== null && apogeeErr > 0 ? "var(--vx-caution)" : undefined}
                title="Predicted apogee minus target — the controller drives this to zero"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Bar(props: { label: string; pct: number | null; accent: string }) {
  const pct = props.pct ?? 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
        <span className="vx-label" style={{ fontSize: 10 }}>{props.label}</span>
        <span className="vx-num" style={{ fontSize: 12, color: "var(--vx-fg)" }}>{props.pct !== null ? `${pct.toFixed(0)}%` : "—"}</span>
      </div>
      <div style={{ position: "relative", height: 8, marginTop: 3, background: "rgba(20,20,23,0.9)", border: "1px solid var(--vx-line)", borderRadius: 2 }}>
        <div style={{ position: "absolute", left: 0, top: 1, bottom: 1, width: `${pct}%`, background: props.accent }} />
      </div>
    </div>
  );
}

/** Vertical scale showing current altitude, predicted apogee, and the target. */
function ApogeeTracker(props: {
  targetM: number;
  predM: number;
  altM: number | null;
  toU: (m: number) => number;
  uLabel: string;
}) {
  const top = Math.max(props.targetM, props.predM, props.altM ?? 0) * 1.1 || 1;
  const y = (m: number) => 100 - Math.max(0, Math.min(100, (m / top) * 100));

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 70, display: "block" }} role="img" aria-label="Apogee tracker">
      <line x1="8" y1="0" x2="8" y2="100" stroke="var(--vx-line)" strokeWidth="0.8" />
      {/* target */}
      <line x1="4" y1={y(props.targetM)} x2="100" y2={y(props.targetM)} stroke="var(--vx-go)" strokeWidth="1" strokeDasharray="3 2" />
      <text x="98" y={Math.max(6, y(props.targetM) - 2)} textAnchor="end" fontSize="7" fill="var(--vx-go)" fontFamily="var(--vx-font-mono)">
        TGT {props.toU(props.targetM).toFixed(0)}
      </text>
      {/* predicted */}
      <line x1="4" y1={y(props.predM)} x2="100" y2={y(props.predM)} stroke="var(--vx-caution)" strokeWidth="1" />
      <text x="98" y={Math.min(98, y(props.predM) + 8)} textAnchor="end" fontSize="7" fill="var(--vx-caution)" fontFamily="var(--vx-font-mono)">
        PRED {props.toU(props.predM).toFixed(0)}
      </text>
      {/* current altitude fill */}
      {props.altM !== null && (
        <rect x="6" y={y(props.altM)} width="4" height={100 - y(props.altM)} fill="var(--vx-accent)" opacity="0.7" />
      )}
    </svg>
  );
}

function Stat(props: { label: string; value: string; color?: string; title?: string }) {
  return (
    <div title={props.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6, marginTop: 8 }}>
      <span className="vx-label" style={{ fontSize: 10 }}>{props.label}</span>
      <span className="vx-num" style={{ fontSize: 13, color: props.color ?? "var(--vx-fg)" }}>{props.value}</span>
    </div>
  );
}
