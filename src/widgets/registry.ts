// src/widgets/registry.ts
export type WidgetId =
  | "raw.console"
  | "altitude.card"
  | "velocity.card"
  | "battery.card"
  | "attitude.card"
  | "vehicle.3d"
  | "gps.map"
  | "imu.card"
  | "flight.summary"
  | "pyro.panel";

export type WidgetCategory = "Core" | "Navigation" | "IMU" | "Attitude" | "Viz" | "Flight" | "Safety";

export type WidgetDef = {
  id: WidgetId;
  name: string;
  category: WidgetCategory;
  requires: string[]; // telemetry keys/capabilities
  hardwareHint: string;
  defaultSize: { w: number; h: number };
  defaultView?: "card" | "instrument" | "plot";
  defaultTheme?: { accent?: string; bg?: string; border?: string };
};

export const WIDGETS: WidgetDef[] = [
  {
    id: "raw.console",
    name: "Raw Console",
    category: "Core",
    requires: [],
    hardwareHint: "Shows raw telemetry lines. Useful for debugging any setup.",
    defaultSize: { w: 12, h: 10 },
    defaultView: "card",
    defaultTheme: { accent: "#7aa2ff" },
  },
  {
    id: "altitude.card",
    name: "Altitude",
    category: "Core",
    requires: ["alt_m"],
    hardwareHint: "Barometer/altimeter required (BMP280/BME280/MS5611 or flight computer altitude output).",
    defaultSize: { w: 4, h: 6 },
    defaultView: "card",
    defaultTheme: { accent: "#7aa2ff" },
  },
  {
    id: "velocity.card",
    name: "Velocity",
    category: "Core",
    requires: ["vel_mps"],
    hardwareHint: "Velocity required (derived onboard or computed from baro/GPS). Recommended: vertical velocity m/s.",
    defaultSize: { w: 4, h: 6 },
    defaultView: "card",
    defaultTheme: { accent: "#7aa2ff" },
  },
  {
    id: "battery.card",
    name: "Battery",
    category: "Core",
    requires: ["batt_v"],
    hardwareHint: "Battery voltage required (divider into ADC or flight computer VBAT output).",
    defaultSize: { w: 4, h: 6 },
    defaultView: "card",
    defaultTheme: { accent: "#7aa2ff" },
  },
  {
    id: "attitude.card",
    name: "Attitude",
    category: "Attitude",
    requires: ["q_w", "q_x", "q_y", "q_z"],
    hardwareHint: "Quaternion required from your flight computer / IMU fusion. (A now, B later: compute onboard).",
    defaultSize: { w: 6, h: 8 },
    defaultView: "instrument",
    defaultTheme: { accent: "#7aa2ff" },
  },
  {
    id: "vehicle.3d",
    name: "3D Vehicle",
    category: "Viz",
    requires: ["q_w", "q_x", "q_y", "q_z"],
    hardwareHint: "Quaternion required. Displays a 3D rocket model driven by q_w/x/y/z.",
    defaultSize: { w: 6, h: 8 },
    defaultView: "instrument",
    defaultTheme: { accent: "#7aa2ff" },
  },
  {
    id: "gps.map",
    name: "GPS Range Map",
    category: "Navigation",
    requires: ["lat", "lon"],
    hardwareHint: "GPS required (any module outputting lat/lon). Offline range map + recovery bearing/distance.",
    defaultSize: { w: 6, h: 8 },
    defaultView: "instrument",
    defaultTheme: { accent: "#7aa2ff" },
  },
  {
    id: "imu.card",
    name: "IMU",
    category: "IMU",
    requires: ["ax", "ay", "az", "gx", "gy", "gz"],
    hardwareHint: "IMU required (MPU-6050/9250/ICM-20948). Output accel + gyro axes.",
    defaultSize: { w: 6, h: 6 },
    defaultView: "card",
    defaultTheme: { accent: "#7aa2ff" },
  },
  {
    id: "flight.summary",
    name: "Flight Summary",
    category: "Flight",
    requires: ["alt_m"],
    hardwareHint: "Altimeter required. Computes apogee, max V/G, phase timings, and descent rates for competition scoring.",
    defaultSize: { w: 6, h: 9 },
    defaultView: "card",
    defaultTheme: { accent: "#24e08a" },
  },
  {
    id: "pyro.panel",
    name: "Pyro / Arming",
    category: "Safety",
    requires: [],
    hardwareHint: "Flight computer with pyro continuity output (pyro_main_cont / pyro_drogue_cont). Shows continuity + armed state.",
    defaultSize: { w: 5, h: 7 },
    defaultView: "card",
    defaultTheme: { accent: "#ffb02e" },
  },
];

export const WIDGETS_BY_CATEGORY = WIDGETS.reduce<Record<string, WidgetDef[]>>((acc, w) => {
  (acc[w.category] ||= []).push(w);
  return acc;
}, {});