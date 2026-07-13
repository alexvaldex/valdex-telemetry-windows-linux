import type { WidgetId } from "./registry";

/**
 * Per-widget help content shown in the widget info panel: what it is, how to
 * wire the flight hardware that feeds it, and how to troubleshoot a blank one.
 *
 * `learnSlug` is appended to the user's own docs URL (set in Settings) to deep
 * link a tutorial — e.g. docsUrl = "https://mysite.com/learn" and
 * learnSlug = "tvc" opens "https://mysite.com/learn/tvc". Widgets without a slug
 * just open the base docs URL.
 */
export type WidgetHelp = {
  about: string;
  /** Telemetry fields this widget reads (frame-contract keys). */
  fields: string[];
  /** How to connect the hardware that produces those fields. */
  connect: string;
  /** Common "why is it blank / wrong" fixes. */
  troubleshoot: string[];
  /** Optional deep-link slug appended to the user's docs URL. */
  learnSlug?: string;
};

const HW_INTRO =
  "VX reads newline-delimited JSON (NDJSON) from your flight computer over the radio link or USB serial. Each line is one frame; only the fields below are needed for this widget.";

export const WIDGET_HELP: Record<WidgetId, WidgetHelp> = {
  "raw.console": {
    about:
      "The unfiltered feed — every line exactly as it arrives, plus a command line to transmit back to the vehicle. Your first stop when something looks wrong: if lines aren't scrolling here, nothing else will work.",
    fields: ["(shows all raw lines)"],
    connect:
      HW_INTRO +
      " Pick your transport (Simulator, or Serial + baud rate) and hit Connect. Lines should appear immediately.",
    troubleshoot: [
      "No lines: check the transport and baud rate match your radio, and that the receiver is powered and paired.",
      "Garbled text: wrong baud rate — try 57600 or 115200, the two most common.",
      "Lines but no widgets update: your field names differ from the contract — open Field Map.",
    ],
  },
  "altitude.card": {
    about:
      "Barometric altitude above the launch site (AGL). The primary number for apogee, and what drives event detection.",
    fields: ["alt_m"],
    connect:
      "Any barometer/altimeter works: BMP280, BME280, MS5611, or a flight computer that outputs altitude. Send it as alt_m (meters) — aliases alt, altitude_ft, and altitude_m map automatically.",
    troubleshoot: [
      "Reads 0 or drifts on the pad: the baro zeroes on the first sample; let it settle before liftoff.",
      "Wildly wrong: you may be sending MSL GPS altitude as alt_m — that field is baro AGL. Use gps_alt_m for MSL.",
    ],
    learnSlug: "altimeter",
  },
  "velocity.card": {
    about: "Vertical velocity (+ up, − down), with Mach once it's moving fast enough. Watch for max-Q and burnout.",
    fields: ["vel_mps", "temp_c"],
    connect:
      "Send vel_mps (meters/second) from your flight computer — either integrated from the accelerometer or differentiated from baro/GPS. temp_c improves the Mach calc (speed of sound).",
    troubleshoot: [
      "Blank: your firmware isn't sending velocity. Compute it onboard, or it can be derived from altitude in a future build.",
      "Noisy: baro-derived velocity is noisy near the ground — accel-integrated is smoother.",
    ],
    learnSlug: "velocity",
  },
  "battery.card": {
    about: "Pack voltage, current draw, and an estimated state-of-charge from your battery profile (set in Settings → Flight).",
    fields: ["batt_v", "current_a"],
    connect:
      "Feed batt_v from a voltage divider into an ADC pin (or your flight computer's VBAT output). current_a is optional — from an INA219/INA226 shunt sensor.",
    troubleshoot: [
      "% looks wrong: set the correct chemistry and cell count (S) in Settings → Flight → Battery Profile.",
      "Voltage reads low: account for the divider ratio in your firmware before sending.",
    ],
    learnSlug: "power",
  },
  "attitude.card": {
    about: "Artificial-horizon attitude from your orientation quaternion — pitch and roll at a glance.",
    fields: ["q_w", "q_x", "q_y", "q_z"],
    connect:
      "Run a fusion filter on your IMU (Madgwick/Mahony or the DMP on an ICM-20948) and output the quaternion as q_w/q_x/q_y/q_z. Aliases qw/qx/qy/qz work too.",
    troubleshoot: [
      "Frozen level: you're not sending a quaternion — the raw IMU accel/gyro alone isn't enough, fuse it onboard.",
      "Points the wrong way: your IMU's mounting axes differ — apply a rotation in firmware or check the up-axis.",
    ],
    learnSlug: "attitude",
  },
  "vehicle.3d": {
    about: "Your uploaded rocket CAD, flying live from telemetry attitude — animates staging and chute deploy through the flight.",
    fields: ["q_w", "q_x", "q_y", "q_z", "event"],
    connect:
      "Upload a .glb/.stl/.obj in Settings → Flight → Vehicle. It flies from the same quaternion the Attitude widget uses; without a quaternion it idles.",
    troubleshoot: [
      "Model on its side: change the nose axis in Vehicle setup until it stands upright.",
      "Doesn't move: no quaternion telemetry — see the Attitude widget notes.",
      "Widget drags when you orbit: lock it with the padlock button in its title bar.",
    ],
    learnSlug: "cad",
  },
  "gps.map": {
    about: "Offline range map: your GPS track projected around the pad, with live recovery bearing and distance. No internet or map tiles needed.",
    fields: ["lat", "lon", "gps_fix", "gps_sats"],
    connect:
      "Any GPS module that outputs lat/lon (u-blox MAX-M10S, etc.). Send lat and lon in decimal degrees; gps_fix and gps_sats show lock quality.",
    troubleshoot: [
      "Empty map: no fix yet — GPS needs open sky and up to a minute for first lock. Watch gps_sats climb.",
      "Track jumps around: low satellite count or urban multipath; wait for more sats.",
      "Pad in the wrong place: the pad is latched at the first fix of the session — reconnect to re-latch.",
    ],
    learnSlug: "gps",
  },
  "imu.card": {
    about: "Raw accelerometer and gyro axes — the ground truth for high-g boost and spin, before any fusion.",
    fields: ["ax", "ay", "az", "gx", "gy", "gz"],
    connect:
      "MPU-6050/9250, ICM-20948, or similar. Send accel in g (ax/ay/az) and gyro in deg/s (gx/gy/gz). For real flights add a high-g accel (H3LIS331) — a ±16g IMU clips during boost.",
    troubleshoot: [
      "Accel clips at ±16g on boost: that's the IMU saturating — you need a dedicated high-g sensor.",
      "Axes swapped: depends on chip mounting; relabel in firmware.",
    ],
    learnSlug: "imu",
  },
  "flight.summary": {
    about: "Post-flight scorecard: apogee, max velocity/accel, phase timings, and descent rates — the numbers competitions ask for.",
    fields: ["alt_m", "vel_mps", "event"],
    connect: "Needs altitude (alt_m) at minimum; velocity and event markers make the summary complete.",
    troubleshoot: [
      "Numbers look truncated: on very long flights the live buffer wraps — the archived flight (Flight Log) keeps the full record.",
      "No phases: send event markers (LIFTOFF, APOGEE, MAIN…) or they're derived from altitude.",
    ],
    learnSlug: "scoring",
  },
  "pyro.panel": {
    about: "Recovery-charge continuity and arm state for drogue and main. Green means the e-match circuit is intact.",
    fields: ["pyro_drogue_cont", "pyro_main_cont"],
    connect:
      "Your flight computer senses continuity across each e-match and reports 1 (good) or 0 (open/fired). Send as pyro_drogue_cont and pyro_main_cont.",
    troubleshoot: [
      "Both show open: e-match not connected, or your continuity sense circuit is wired backwards.",
      "Never changes at deploy: confirm the firmware flips the value to 0 when the channel fires.",
    ],
    learnSlug: "pyro",
  },
  "env.card": {
    about: "Onboard environment: temperature, barometric pressure, and humidity. Pressure altitude and density come from here.",
    fields: ["temp_c", "pressure_pa", "humidity_pct"],
    connect:
      "A BME280 gives all three; BMP280/MS5611 give temp + pressure. Send temp_c (°C), pressure_pa (Pascals), humidity_pct (%). Aliases temp_f, pressure_hpa/mbar convert automatically.",
    troubleshoot: [
      "Pressure looks like ~1000 not ~100000: you're sending hPa as pressure_pa — use pressure_hpa, it converts.",
      "Temp reads high on the pad: sensor self-heating or sun on the airframe; shade it.",
    ],
    learnSlug: "environment",
  },
  "checklist.panel": {
    about: "An editable pre-flight checklist. No hardware — it's range-safety discipline, and the progress feeds your GO/NO-GO habit.",
    fields: ["(no telemetry)"],
    connect: "Nothing to connect. Edit items inline, check them off at the pad, Reset for the next flight.",
    troubleshoot: ["Lost your custom items: the list is saved in this browser only; it won't follow you to another machine."],
  },
  "tilt.spin": {
    about: "Off-vertical tilt (a range-safety limit) and roll rate. Tilt over ~20° off vertical is often a NO-GO.",
    fields: ["q_w", "q_x", "q_y", "q_z", "gz"],
    connect: "Tilt comes from the orientation quaternion (see Attitude); roll rate from the gyro Z axis (gz), deg/s.",
    troubleshoot: [
      "Tilt stuck at 0: no quaternion — fuse the IMU onboard.",
      "Roll rate blank: send gz (or gy depending on your body axis convention).",
    ],
    learnSlug: "attitude",
  },
  "link.quality": {
    about: "Radio health: RSSI, SNR, frame rate, and packet loss. The first thing to sag when you're near the edge of range.",
    fields: ["rssi_dbm", "snr_db", "seq"],
    connect:
      "Report the receiver's RSSI (dBm) and SNR (dB) — SiK/RFD900 radios and LoRa modules expose these. Add a per-frame seq counter for true loss statistics.",
    troubleshoot: [
      "No RSSI: your receiver isn't forwarding link stats; some radios need a config flag.",
      "High loss: raise antenna height, check orientation, or drop the air data rate on the radio (Settings → Tools → Radio).",
    ],
    learnSlug: "radio",
  },
  "tvc.panel": {
    about:
      "Thrust vector control — a gimballed motor mount that steers by tilting the thrust. This panel shows commanded vs actual deflection and how hard the controller is working. TVC is what lets a rocket balance upright like a Starship hop.",
    fields: ["tvc_pitch_deg", "tvc_yaw_deg", "tvc_pitch_fb_deg", "tvc_yaw_fb_deg", "tvc_enabled"],
    connect:
      "Your TVC controller sends the commanded gimbal angles as tvc_pitch_deg / tvc_yaw_deg (degrees). If your servos report their real position, send tvc_pitch_fb_deg / tvc_yaw_fb_deg too and the panel shows tracking error. tvc_enabled (0/1) marks when the loop is live.",
    troubleshoot: [
      "Blank panel: send at least tvc_pitch_deg and tvc_yaw_deg.",
      "Marker pinned at the red ring: you're commanding past the mount's mechanical limit — reduce gain or increase the limit.",
      "Big gap between command and feedback: servos are too slow or under-powered for the loop rate.",
    ],
    learnSlug: "tvc",
  },
  "canard.panel": {
    about:
      "Canard fins — small steering fins near the nose, on servos, that hold roll and steer the rocket. This panel shows each fin's deflection and the roll rate they're damping. Canards are how a rocket actively keeps from spinning up.",
    fields: ["canard_1_deg", "canard_2_deg", "canard_3_deg", "canard_4_deg", "roll_rate_dps", "canard_enabled"],
    connect:
      "Your fin controller sends each servo's deflection as canard_1_deg..canard_4_deg (degrees) and the measured roll_rate_dps (deg/s) it's correcting. canard_enabled (0/1) marks when the loop is live. Aliases fin1..fin4 and roll_rate work.",
    troubleshoot: [
      "Blank: send at least canard_1_deg.",
      "Roll rate high (red) while fins max out: the fins are saturated — more fin area or gain needed, or you're past their airspeed authority.",
      "Fins fight each other: check the sign of each servo — opposing pairs (1/3 vs 2/4) should move opposite for roll.",
    ],
    learnSlug: "canards",
  },
};

/** Build the Learn-more URL for a widget from the user's configured docs base. */
export function learnMoreUrl(base: string, id: WidgetId): string | null {
  const trimmed = base.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  const slug = WIDGET_HELP[id]?.learnSlug;
  return slug ? `${trimmed}/${slug}` : trimmed;
}
