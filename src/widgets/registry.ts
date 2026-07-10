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
  | "pyro.panel"
  | "env.card"
  | "checklist.panel"
  | "tilt.spin"
  | "link.quality"
  | "tvc.panel";

export type WidgetCategory = "Core" | "Navigation" | "IMU" | "Attitude" | "Viz" | "Flight" | "Safety" | "Sensors" | "Link" | "Control";

export type WidgetView = "card" | "instrument" | "plot";

export type WidgetDef = {
  id: WidgetId;
  name: string;
  category: WidgetCategory;
  requires: string[]; // telemetry keys/capabilities
  hardwareHint: string;
  defaultSize: { w: number; h: number };
  defaultView?: WidgetView;
  views?: WidgetView[]; // views this widget actually implements (default: ["card"])
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
    views: ["card"],
    defaultTheme: { accent: "#a2a6ae" },
  },
  {
    id: "altitude.card",
    name: "Altitude",
    category: "Core",
    requires: ["alt_m"],
    hardwareHint: "Barometer/altimeter required (BMP280/BME280/MS5611 or flight computer altitude output).",
    defaultSize: { w: 4, h: 6 },
    defaultView: "card",
    views: ["card", "instrument", "plot"],
    defaultTheme: { accent: "#a2a6ae" },
  },
  {
    id: "velocity.card",
    name: "Velocity",
    category: "Core",
    requires: ["vel_mps"],
    hardwareHint: "Velocity required (derived onboard or computed from baro/GPS). Recommended: vertical velocity m/s.",
    defaultSize: { w: 4, h: 6 },
    defaultView: "card",
    views: ["card", "instrument", "plot"],
    defaultTheme: { accent: "#a2a6ae" },
  },
  {
    id: "battery.card",
    name: "Battery",
    category: "Core",
    requires: ["batt_v"],
    hardwareHint: "Battery voltage required (divider into ADC or flight computer VBAT output).",
    defaultSize: { w: 4, h: 6 },
    defaultView: "card",
    views: ["card", "instrument", "plot"],
    defaultTheme: { accent: "#a2a6ae" },
  },
  {
    id: "attitude.card",
    name: "Attitude",
    category: "Attitude",
    requires: ["q_w", "q_x", "q_y", "q_z"],
    hardwareHint: "Quaternion required from your flight computer / IMU fusion. (A now, B later: compute onboard).",
    defaultSize: { w: 6, h: 8 },
    defaultView: "instrument",
    views: ["card", "instrument", "plot"],
    defaultTheme: { accent: "#a2a6ae" },
  },
  {
    id: "vehicle.3d",
    name: "3D Vehicle",
    category: "Viz",
    requires: [], // always addable — shows your CAD; live attitude (q_w..q_z) drives it when present
    hardwareHint: "Shows your uploaded rocket CAD. With quaternion telemetry (q_w/x/y/z) it flies live; without, it idles.",
    defaultSize: { w: 6, h: 8 },
    defaultView: "instrument",
    views: ["instrument"],
    defaultTheme: { accent: "#a2a6ae" },
  },
  {
    id: "gps.map",
    name: "GPS Range Map",
    category: "Navigation",
    requires: ["lat", "lon"],
    hardwareHint: "GPS required (any module outputting lat/lon). Offline range map + recovery bearing/distance.",
    defaultSize: { w: 6, h: 8 },
    defaultView: "instrument",
    views: ["card", "instrument"],
    defaultTheme: { accent: "#a2a6ae" },
  },
  {
    id: "imu.card",
    name: "IMU",
    category: "IMU",
    requires: ["ax", "ay", "az", "gx", "gy", "gz"],
    hardwareHint: "IMU required (MPU-6050/9250/ICM-20948). Output accel + gyro axes.",
    defaultSize: { w: 6, h: 6 },
    defaultView: "card",
    views: ["card"],
    defaultTheme: { accent: "#a2a6ae" },
  },
  {
    id: "flight.summary",
    name: "Flight Summary",
    category: "Flight",
    requires: ["alt_m"],
    hardwareHint: "Altimeter required. Computes apogee, max V/G, phase timings, and descent rates for competition scoring.",
    defaultSize: { w: 6, h: 9 },
    defaultView: "card",
    views: ["card"],
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
    views: ["card"],
    defaultTheme: { accent: "#ffb02e" },
  },
  {
    id: "env.card",
    name: "Environment",
    category: "Sensors",
    requires: ["environment"],
    hardwareHint: "Onboard baro/temp sensor (BMP280/BME280/MS5611). Shows temperature, pressure, and humidity.",
    defaultSize: { w: 5, h: 7 },
    defaultView: "card",
    views: ["card", "plot"],
    defaultTheme: { accent: "#d8dbe0" },
  },
  {
    id: "checklist.panel",
    name: "Pre-flight Checklist",
    category: "Safety",
    requires: [],
    hardwareHint: "No hardware required. L3-style pre-flight checklist — progress feeds range-safety discipline.",
    defaultSize: { w: 4, h: 10 },
    defaultView: "card",
    views: ["card"],
    defaultTheme: { accent: "#24e08a" },
  },
  {
    id: "tilt.spin",
    name: "Tilt & Spin",
    category: "Attitude",
    requires: ["q_w", "q_x", "q_y", "q_z"],
    hardwareHint: "Quaternion required. Off-vertical tilt (range-safety limit) + roll rate from gyro.",
    defaultSize: { w: 4, h: 6 },
    defaultView: "card",
    views: ["card", "plot"],
    defaultTheme: { accent: "#ffb02e" },
  },
  {
    id: "link.quality",
    name: "Link Quality",
    category: "Link",
    requires: ["rssi_dbm"],
    hardwareHint: "Radio RSSI required (LoRa/RFD900/etc). Shows RSSI, SNR, frame rate, and gap heuristic.",
    defaultSize: { w: 5, h: 7 },
    defaultView: "card",
    views: ["card", "plot"],
    defaultTheme: { accent: "#d8dbe0" },
  },
  {
    id: "tvc.panel",
    name: "TVC Test",
    category: "Control",
    requires: ["tvc_pitch_deg", "tvc_yaw_deg"],
    hardwareHint: "Gimballed motor mount. Send tvc_pitch_deg / tvc_yaw_deg (commanded); add tvc_pitch_fb_deg / tvc_yaw_fb_deg for servo tracking error.",
    defaultSize: { w: 6, h: 8 },
    defaultView: "card",
    views: ["card"],
    defaultTheme: { accent: "#d8dbe0" },
  },
];

export const WIDGETS_BY_CATEGORY = WIDGETS.reduce<Record<string, WidgetDef[]>>((acc, w) => {
  (acc[w.category] ||= []).push(w);
  return acc;
}, {});