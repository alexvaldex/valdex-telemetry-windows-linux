/**
 * Flight simulation engine.
 *
 * 1-DoF vertical physics (thrust, gravity, quadratic drag with a real density
 * model) plus wind drift, driven by a user profile: the rocket, the motor,
 * the recovery gear, and the day — pad elevation, temperature, season, wind.
 * The same integrator powers the live Simulator transport (so simulated
 * telemetry matches the physics) and instant pre-flight predictions (apogee,
 * max velocity/Mach, flight time, drift, landing coordinates) for recovery
 * planning.
 */

export type MotorSpec = {
  name: string;
  impulseNs: number;   // total impulse
  avgThrustN: number;  // average thrust
  burnS: number;       // burn time
  propKg: number;      // propellant mass
};

/** Approximate specs for common certified motors — good enough for planning;
    enter exact numbers via Custom for competition work. */
export const MOTORS: MotorSpec[] = [
  { name: "G80 (approx)", impulseNs: 137, avgThrustN: 80, burnS: 1.7, propKg: 0.063 },
  { name: "H128 (approx)", impulseNs: 176, avgThrustN: 128, burnS: 1.4, propKg: 0.094 },
  { name: "H550 (approx)", impulseNs: 300, avgThrustN: 550, burnS: 0.55, propKg: 0.16 },
  { name: "I218 (approx)", impulseNs: 330, avgThrustN: 218, burnS: 1.5, propKg: 0.19 },
  { name: "I600 (approx)", impulseNs: 620, avgThrustN: 600, burnS: 1.0, propKg: 0.31 },
  { name: "J350 (approx)", impulseNs: 700, avgThrustN: 350, burnS: 2.0, propKg: 0.36 },
  { name: "J800 (approx)", impulseNs: 1150, avgThrustN: 800, burnS: 1.4, propKg: 0.55 },
  { name: "K550 (approx)", impulseNs: 1520, avgThrustN: 550, burnS: 2.8, propKg: 0.78 },
  { name: "K1100 (approx)", impulseNs: 2450, avgThrustN: 1100, burnS: 2.2, propKg: 1.2 },
  { name: "L1150 (approx)", impulseNs: 3600, avgThrustN: 1150, burnS: 3.1, propKg: 1.7 },
  { name: "L2200 (approx)", impulseNs: 5000, avgThrustN: 2200, burnS: 2.3, propKg: 2.4 },
  { name: "M1297 (approx)", impulseNs: 6400, avgThrustN: 1297, burnS: 4.9, propKg: 3.0 },
];

export type SimRocket = {
  dryKg: number;       // mass without motor propellant
  diameterMm: number;  // airframe diameter
  cd: number;          // drag coefficient (typical HPR 0.4–0.6)
};

export type SimRecovery = {
  drogueDescentMps: number; // descent rate under drogue
  mainDescentMps: number;   // descent rate under main
  mainDeployAltM: number;   // main deployment altitude AGL
};

export type SimEnvironment = {
  padLat: number;
  padLon: number;
  padAltM: number;     // pad elevation MSL
  tempC: number;       // surface temperature at the pad
  windMps: number;     // surface wind speed
  windDirDeg: number;  // direction the wind blows FROM (met convention)
  month: number;       // 1–12, for the season presets / report labeling
};

export type SimProfile = {
  name: string;
  rocket: SimRocket;
  motor: MotorSpec;
  recovery: SimRecovery;
  env: SimEnvironment;
  twoStage: boolean;
};

export const DEFAULT_SIM_PROFILE: SimProfile = {
  name: "My Rocket",
  rocket: { dryKg: 5.4, diameterMm: 102, cd: 0.45 },
  motor: MOTORS.find((m) => m.name.startsWith("J350"))!,
  recovery: { drogueDescentMps: 20, mainDescentMps: 5, mainDeployAltM: 300 },
  env: { padLat: 32.9903, padLon: -106.9749, padAltM: 1400, tempC: 20, windMps: 4.5, windDirDeg: 250, month: 6 },
  twoStage: false,
};

/** Seasonal surface-temperature presets (desert-range flavored). Density
    altitude is the point: a July launch flies higher than a January one. */
export const SEASON_PRESETS: Array<{ name: string; month: number; tempC: number }> = [
  { name: "Winter", month: 1, tempC: 5 },
  { name: "Spring", month: 4, tempC: 18 },
  { name: "Summer", month: 7, tempC: 35 },
  { name: "Fall", month: 10, tempC: 20 },
];

const KEY = "vx.simProfile";

export function loadSimProfile(): SimProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_SIM_PROFILE);
    const p = JSON.parse(raw) as Partial<SimProfile>;
    // Deep-merge over defaults so new fields never break saved profiles.
    const d = structuredClone(DEFAULT_SIM_PROFILE);
    return {
      ...d,
      ...p,
      rocket: { ...d.rocket, ...p.rocket },
      motor: { ...d.motor, ...p.motor },
      recovery: { ...d.recovery, ...p.recovery },
      env: { ...d.env, ...p.env },
    };
  } catch {
    return structuredClone(DEFAULT_SIM_PROFILE);
  }
}

export function saveSimProfile(p: SimProfile) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

/* ---------------- Atmosphere & forces ---------------- */

const G0 = 9.80665;
const R_AIR = 287.05;

/** Air density at absolute altitude, anchored to the measured pad temperature
    (this is what makes a hot July day fly higher than a cold January one). */
export function airDensity(absAltM: number, padAltM: number, padTempC: number): number {
  const p = 101325 * Math.pow(1 - 2.25577e-5 * Math.min(absAltM, 11000), 5.25588); // ISA pressure
  const tK = padTempC + 273.15 - 0.0065 * (absAltM - padAltM); // measured lapse from the pad
  return p / (R_AIR * Math.max(tK, 180));
}

export function speedOfSound(absAltM: number, padAltM: number, padTempC: number): number {
  const tK = padTempC + 273.15 - 0.0065 * (absAltM - padAltM);
  return Math.sqrt(1.4 * R_AIR * Math.max(tK, 180));
}

function frontalAreaM2(diameterMm: number): number {
  const r = diameterMm / 2000;
  return Math.PI * r * r;
}

export function dragN(velMps: number, altAglM: number, p: SimProfile): number {
  const rho = airDensity(p.env.padAltM + Math.max(0, altAglM), p.env.padAltM, p.env.tempC);
  return 0.5 * rho * velMps * velMps * p.rocket.cd * frontalAreaM2(p.rocket.diameterMm);
}

/* ---------------- Integrator ---------------- */

export type FlightPhase = "pad" | "boost" | "coast" | "drogue" | "main" | "landed";

export type FlightState = {
  t: number;        // seconds since ignition
  altAgl: number;
  vel: number;      // vertical, + up
  phase: FlightPhase;
  massKg: number;
  events: string[]; // events fired during the last step
};

export function initialFlightState(p: SimProfile): FlightState {
  return { t: 0, altAgl: 0, vel: 0, phase: "pad", massKg: p.rocket.dryKg + p.motor.propKg, events: [] };
}

/** Advance one step. Mutates and returns the state; `state.events` holds any
    events that fired during this step. */
export function stepFlight(s: FlightState, p: SimProfile, dt: number): FlightState {
  s.events = [];
  if (s.phase === "landed") return s;

  s.t += dt;

  if (s.phase === "pad") {
    s.phase = "boost";
    s.events.push("LIFTOFF");
  }

  if (s.phase === "boost") {
    const burning = s.t <= p.motor.burnS;
    const thrust = burning ? p.motor.avgThrustN : 0;
    s.massKg = p.rocket.dryKg + p.motor.propKg * Math.max(0, 1 - s.t / p.motor.burnS);
    const drag = dragN(s.vel, s.altAgl, p) * Math.sign(s.vel);
    const a = (thrust - drag) / s.massKg - G0;
    s.vel += a * dt;
    s.altAgl += s.vel * dt;
    if (!burning) {
      s.phase = "coast";
      s.events.push("BURNOUT");
    }
    if (s.altAgl < 0) { s.altAgl = 0; s.vel = 0; } // failed liftoff (T/W < 1)
    return s;
  }

  if (s.phase === "coast") {
    const drag = dragN(s.vel, s.altAgl, p) * Math.sign(s.vel);
    const a = -drag / s.massKg - G0;
    s.vel += a * dt;
    s.altAgl += s.vel * dt;
    if (s.vel <= 0) {
      s.phase = "drogue";
      s.events.push("APOGEE");
    }
    return s;
  }

  if (s.phase === "drogue") {
    s.vel = -p.recovery.drogueDescentMps;
    s.altAgl += s.vel * dt;
    if (s.altAgl <= p.recovery.mainDeployAltM) {
      s.phase = "main";
      s.events.push("MAIN");
    }
    return s;
  }

  // main
  s.vel = -p.recovery.mainDescentMps;
  s.altAgl += s.vel * dt;
  if (s.altAgl <= 0) {
    s.altAgl = 0;
    s.vel = 0;
    s.phase = "landed";
    s.events.push("LANDING");
  }
  return s;
}

/** Wind velocity components (blowing TOWARD dir+180): east, north in m/s. */
export function windEN(p: SimProfile): { e: number; n: number } {
  const toRad = ((p.env.windDirDeg + 180) * Math.PI) / 180;
  return { e: p.env.windMps * Math.sin(toRad), n: p.env.windMps * Math.cos(toRad) };
}

/** Drift factor by phase: full push under canopy, slight during ascent. */
export function driftFactor(phase: FlightPhase): number {
  if (phase === "drogue" || phase === "main") return 1;
  if (phase === "boost" || phase === "coast") return 0.15;
  return 0;
}

/* ---------------- Pre-flight prediction ---------------- */

const M_PER_DEG_LAT = 111_320;

export type FlightPrediction = {
  apogeeM: number;
  maxVelMps: number;
  maxMach: number;
  maxAccelG: number;
  burnoutAltM: number;
  apogeeS: number;
  flightS: number;
  thrustToWeight: number;
  driftM: number;
  driftBearingDeg: number; // bearing from pad to landing
  landLat: number;
  landLon: number;
  failsToLift: boolean;
};

export function simulatePreflight(p: SimProfile): FlightPrediction {
  const s = initialFlightState(p);
  const dt = 0.02;
  const wind = windEN(p);

  let apogeeM = 0, maxVel = 0, maxAccG = 0, burnoutAlt = 0, apogeeS = 0;
  let e = 0, n = 0;
  let prevVel = 0;
  const tw = (p.motor.avgThrustN / (s.massKg * G0));

  let guard = 0;
  while (s.phase !== "landed" && guard++ < 120_000) {
    stepFlight(s, p, dt);
    if (s.altAgl > apogeeM) apogeeM = s.altAgl;
    if (s.vel > maxVel) maxVel = s.vel;
    const accG = Math.abs((s.vel - prevVel) / dt) / G0;
    if (s.phase === "boost" && accG > maxAccG) maxAccG = accG;
    prevVel = s.vel;
    if (s.events.includes("BURNOUT")) burnoutAlt = s.altAgl;
    if (s.events.includes("APOGEE")) apogeeS = s.t;
    const f = driftFactor(s.phase);
    e += wind.e * f * dt;
    n += wind.n * f * dt;
    if (tw <= 1 && s.t > 2) break; // never leaves the rail
  }

  const driftM = Math.sqrt(e * e + n * n);
  let bearing = (Math.atan2(e, n) * 180) / Math.PI;
  if (bearing < 0) bearing += 360;
  const landLat = p.env.padLat + n / M_PER_DEG_LAT;
  const landLon = p.env.padLon + e / (M_PER_DEG_LAT * Math.cos((p.env.padLat * Math.PI) / 180));
  const a0 = speedOfSound(p.env.padAltM + burnoutAlt, p.env.padAltM, p.env.tempC);

  return {
    apogeeM,
    maxVelMps: maxVel,
    maxMach: maxVel / a0,
    maxAccelG: maxAccG,
    burnoutAltM: burnoutAlt,
    apogeeS,
    flightS: s.t,
    thrustToWeight: tw,
    driftM,
    driftBearingDeg: bearing,
    landLat,
    landLon,
    failsToLift: tw <= 1,
  };
}

/** Google Maps walking directions from the pad to a point — recovery-route
    rehearsal for the exact day/conditions you just simulated. */
export function recoveryRouteUrl(padLat: number, padLon: number, lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${padLat.toFixed(6)},${padLon.toFixed(6)}&destination=${lat.toFixed(6)},${lon.toFixed(6)}&travelmode=walking`;
}
