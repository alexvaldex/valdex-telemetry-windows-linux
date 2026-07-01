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
  | "pyro";

export function deriveCapabilities(latest?: TelemetryFrameV1): Set<Capability> {
  const caps = new Set<Capability>();
  if (!latest) return caps;

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

  return caps;
}