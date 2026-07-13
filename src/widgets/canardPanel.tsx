import type { TelemetryFrameV1 } from "../telemetry/types";

/**
 * Canard fin control panel.
 *
 * Canards are small forward fins that steer the rocket and hold roll. This panel
 * shows each fin's live deflection and the roll rate the controller is damping —
 * the two things you watch on a canard bench test or an active-stabilization
 * flight. Four fins in an X layout is the common case; unused fins simply don't
 * render.
 *
 * Drive it with `canard_1_deg`..`canard_4_deg` (per-fin deflection) and
 * `roll_rate_dps` (measured roll rate). Aliases: `fin1`..`fin4`, `roll_rate`.
 */

/** Typical servo-limited fin travel, degrees. */
const FIN_LIMIT_DEG = 15;
/** Roll rate beyond this (deg/s) is flagged — the canards are losing the fight. */
const ROLL_WARN_DPS = 180;

function clampFin(d: number): number {
  return Math.max(-FIN_LIMIT_DEG, Math.min(FIN_LIMIT_DEG, d));
}

export function CanardPanelWidget(props: { frames: TelemetryFrameV1[]; latest?: TelemetryFrameV1 }) {
  const { latest } = props;

  const fins: Array<number | null> = [
    typeof latest?.canard_1_deg === "number" ? latest.canard_1_deg : null,
    typeof latest?.canard_2_deg === "number" ? latest.canard_2_deg : null,
    typeof latest?.canard_3_deg === "number" ? latest.canard_3_deg : null,
    typeof latest?.canard_4_deg === "number" ? latest.canard_4_deg : null,
  ];
  const present = fins.some((f) => f !== null);
  const rollRate = typeof latest?.roll_rate_dps === "number" ? latest.roll_rate_dps : null;
  const rollCmd = typeof latest?.canard_roll_cmd_deg === "number" ? latest.canard_roll_cmd_deg : null;
  const enabled = latest?.canard_enabled === 1;

  if (!present) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100%", textAlign: "center", padding: 16 }}>
        <div>
          <div className="vx-label" style={{ marginBottom: 8 }}>No Canard Telemetry</div>
          <div style={{ fontSize: 12, color: "var(--vx-fg-faint)", lineHeight: 1.6, maxWidth: 260 }}>
            Send <code>canard_1_deg</code>..<code>canard_4_deg</code> for per-fin deflection,
            and <code>roll_rate_dps</code> for the roll rate the fins are damping.
          </div>
        </div>
      </div>
    );
  }

  const rollHot = rollRate !== null && Math.abs(rollRate) > ROLL_WARN_DPS;
  const statusColor = !enabled ? "var(--vx-fg-faint)" : rollHot ? "var(--vx-crit)" : "var(--vx-go)";
  const statusText = !enabled ? "DISARMED" : rollHot ? "ROLL HIGH" : "ACTIVE";

  // Body cross-section (viewBox 100x100). Four fins at N/E/S/W; each rotates
  // about its root by its deflection so you can see the fins working.
  const cx = 50, cy = 50, bodyR = 14, finLen = 26;
  const finAngles = [0, 90, 180, 270]; // fin 1 up, 2 right, 3 down, 4 left

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div className="vx-label">Canard Fins</div>
        <span className="vx-chip" style={{ borderColor: statusColor, color: statusColor }} title="Canard controller state">
          {statusText}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,150px)", gap: 12, flex: 1, minHeight: 0 }}>
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", maxHeight: 240, minHeight: 0 }} role="img" aria-label="Canard fin positions, viewed from the nose">
          <circle cx={cx} cy={cy} r={bodyR} fill="none" stroke="var(--vx-line-strong)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="1.5" fill="var(--vx-fg-faint)" />

          {finAngles.map((baseDeg, i) => {
            const defl = fins[i];
            const has = defl !== null;
            // Fin extends radially; deflection tilts it about its root.
            const a = (baseDeg * Math.PI) / 180;
            const rootX = cx + Math.cos(a) * bodyR;
            const rootY = cy + Math.sin(a) * bodyR;
            const tipBase = baseDeg + (has ? clampFin(defl as number) : 0);
            const ta = (tipBase * Math.PI) / 180;
            const tipX = rootX + Math.cos(ta) * finLen;
            const tipY = rootY + Math.sin(ta) * finLen;
            // A little width to the fin so it reads as a surface, not a line.
            const perp = ((baseDeg + 90) * Math.PI) / 180;
            const w = 3;
            const color = !has ? "var(--vx-line)" : enabled ? "var(--vx-accent-bright)" : "var(--vx-fg-faint)";
            return (
              <g key={i}>
                <polygon
                  points={`${rootX + Math.cos(perp) * w},${rootY + Math.sin(perp) * w} ${rootX - Math.cos(perp) * w},${rootY - Math.sin(perp) * w} ${tipX},${tipY}`}
                  fill={color}
                  opacity={has ? 0.9 : 0.3}
                />
                <text
                  x={cx + Math.cos(a) * (bodyR + finLen + 6)}
                  y={cy + Math.sin(a) * (bodyR + finLen + 6) + 2}
                  fontSize="5"
                  textAnchor="middle"
                  fill="var(--vx-fg-faint)"
                  fontFamily="var(--vx-font-mono)"
                >
                  {has ? `${(defl as number) >= 0 ? "+" : ""}${(defl as number).toFixed(0)}°` : "—"}
                </text>
              </g>
            );
          })}
          <text x="50" y="8" fontSize="4.5" textAnchor="middle" fill="var(--vx-fg-faint)">view from nose</text>
        </svg>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0, overflow: "auto" }}>
          {fins.map((f, i) =>
            f !== null ? <FinRow key={i} n={i + 1} deg={f} /> : null
          )}
          {rollRate !== null && (
            <Stat
              label="Roll rate"
              value={`${rollRate >= 0 ? "+" : ""}${rollRate.toFixed(0)}°/s`}
              color={rollHot ? "var(--vx-crit)" : undefined}
              title="Measured roll rate the canards are damping"
            />
          )}
          {rollCmd !== null && <Stat label="Roll cmd" value={`${rollCmd >= 0 ? "+" : ""}${rollCmd.toFixed(1)}°`} title="Commanded roll effort" />}
        </div>
      </div>
    </div>
  );
}

function FinRow(props: { n: number; deg: number }) {
  const pct = (clampFin(props.deg) / FIN_LIMIT_DEG) * 50;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
        <span className="vx-label" style={{ fontSize: 10 }}>Fin {props.n}</span>
        <span className="vx-num" style={{ fontSize: 12, color: "var(--vx-fg)" }}>
          {props.deg >= 0 ? "+" : ""}{props.deg.toFixed(1)}°
        </span>
      </div>
      <div style={{ position: "relative", height: 7, marginTop: 3, background: "rgba(20,20,23,0.9)", border: "1px solid var(--vx-line)", borderRadius: 2 }}>
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--vx-line-strong)" }} />
        <div
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
