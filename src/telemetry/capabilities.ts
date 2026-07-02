import type { TelemetryFrameV1 } from "./types";

export type Capability =
  | "altitude"
  | "velocity"
  | "battery"
  | "gps.latlon"
  | "gps.fix"
  | "imu.accel"
  | "imu.gyro"
  | "orientation"
  | "pyro"
  | "environment";

/**
 * Returns a set of "capabilities" the current stream can drive. This includes
 * both semantic capability names (e.g. "altitude") AND the raw frame keys that
 * are present (e.g. "alt_m") — widget `requires` in the registry are expressed
 * as frame keys, so including them here is what makes capability-gating work.
 */
export function deriveCapabilities(latest?: TelemetryFrameV1): Set<string> {
  const caps = new Set<string>();
  if (!latest) return caps;

  // Raw frame keys that carry a value — these back the registry `requires`.
  for (const k of Object.keys(latest)) {
    const v = (latest as any)[k];
    if (v !== undefined && v !== null) caps.add(k);
  }

  // Semantic capabilities (used by some code paths / future gating).
  if (latest.alt_m !== undefined) caps.add("altitude");
  if (latest.vel_mps !== undefined) caps.add("velocity");
  if (latest.batt_v !== undefined) caps.add("battery");

  if (latest.lat !== undefined && latest.lon !== undefined)
    caps.add("gps.latlon");

  if (latest.gps_fix !== undefined) caps.add("gps.fix");

  if (latest.ax !== undefined && latest.ay !== undefined && latest.az !== undefined)
    caps.add("imu.accel");

  if (latest.gx !== undefined && latest.gy !== undefined && latest.gz !== undefined)
    caps.add("imu.gyro");

  if (latest.q_w !== undefined) caps.add("orientation");

  if (latest.pyro_main_cont !== undefined || latest.pyro_drogue_cont !== undefined)
    caps.add("pyro");

  if ((latest as any).temp_c !== undefined || (latest as any).pressure_pa !== undefined || (latest as any).humidity_pct !== undefined)
    caps.add("environment");

  return caps;
}