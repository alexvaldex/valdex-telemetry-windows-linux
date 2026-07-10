import type { Connection, ConnectOptions, ConnectionStatus } from "./types";
import { appendChecksum } from "../telemetry/crc";
import {
  loadSimProfile,
  initialFlightState,
  stepFlight,
  windEN,
  driftFactor as simDriftFactor,
  type SimProfile,
  type FlightState,
} from "../telemetry/flightSim";

type Phase = "idle" | "boost" | "coast" | "drogue" | "main" | "landed";

const G = 9.81;
const BOOST_ACCEL = 100; // net m/s^2 during motor burn
const BOOST_DURATION_S = 2.5;
const COAST_DECEL = 25; // m/s^2 (gravity + drag) during coast to apogee
const DROGUE_VEL = -20; // m/s
const MAIN_DEPLOY_ALT_M = 300;
const MAIN_VEL = -5; // m/s
const TICK_MS = 50; // 20Hz emission rate
// Sim-seconds per real-second. 1 = true real time (the mission clock matches
// your wall clock; a full flight takes ~2¼ minutes like a real one would).
// Bump temporarily if you want a fast demo run.
const SIM_SPEED = 1;

// Launch pad location (near a typical HPR range) + wind drift for recovery realism
const PAD_LAT = 32.9903;   // ~ FAR / Mojave-ish
const PAD_LON = -106.9749;
const PAD_ALT_M = 1400;    // pad elevation above sea level (affects baro/temp)
const M_PER_DEG_LAT = 111_320;

/* Minimal quaternion helpers for the simulated attitude (w,x,y,z). */
type Quat = { w: number; x: number; y: number; z: number };
function qAxis(ax: number, ay: number, az: number, deg: number): Quat {
  const r = (deg * Math.PI) / 180;
  const s = Math.sin(r / 2);
  return { w: Math.cos(r / 2), x: ax * s, y: ay * s, z: az * s };
}
function qMul(a: Quat, b: Quat): Quat {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}
const WIND_E_MPS = 4.5;    // eastward wind pushes vehicle downrange under chute
const WIND_N_MPS = 1.5;

export class SimulatorConnection implements Connection {
  status: ConnectionStatus = "disconnected";

  private timer: ReturnType<typeof setInterval> | null = null;
  private lineListeners = new Set<(line: string) => void>();
  private statusListeners = new Set<(status: ConnectionStatus) => void>();

  private phase: Phase = "idle";
  private phaseStartMs = 0; // sim time (ms) at which current phase started
  private phaseStartAlt = 0;
  private phaseStartVel = 0;
  private simMs = 0; // total elapsed sim time
  private battV = 8.4;
  private armed = false;

  // Recovery / GPS drift state (meters east/north of pad)
  private posE = 0;
  private posN = 0;
  // Pyro continuity (1 = good/charge present, 0 = fired/open)
  private drogueCont: 0 | 1 = 1;
  private mainCont: 0 | 1 = 1;
  private drogueEventSent = false;
  private spinDeg = 0; // accumulated roll about the long axis
  private tvcPitchFb = 0; // TVC servo feedback (lags the command)
  private tvcYawFb = 0;

  // Per-stream packet sequence counters (~1.5% simulated drop rate).
  private seqSust = 0;
  private seqBstr = 0;

  // Separated booster — its own tracker stream (vid "BSTR") after staging.
  private booster: {
    phase: "coast" | "descent" | "landed";
    alt: number;
    vel: number;
    posE: number;
    posN: number;
    pendingEvent?: string;
  } | null = null;

  onLine(cb: (line: string) => void): () => void {
    this.lineListeners.add(cb);
    return () => this.lineListeners.delete(cb);
  }

  onStatusChange(cb: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach((cb) => cb(status));
  }

  async connect(_opts: ConnectOptions): Promise<void> {
    this.setStatus("connecting");

    this.phase = "idle";
    this.phaseStartMs = 0;
    this.phaseStartAlt = 0;
    this.phaseStartVel = 0;
    this.simMs = 0;
    this.battV = 8.4;
    this.armed = false;
    this.posE = 0;
    this.posN = 0;
    this.drogueCont = 1;
    this.mainCont = 1;
    this.drogueEventSent = false;
    this.spinDeg = 0;
    this.tvcPitchFb = 0;
    this.tvcYawFb = 0;
    this.booster = null;
    this.seqSust = 0;
    this.seqBstr = 0;

    // Fly the user's configured rocket/motor/day (Sim Setup).
    this.profile = loadSimProfile();
    this.fs = null;
    this.eventQueue = [];
    this.phaseT = 0;
    const w = windEN(this.profile);
    this.windE = w.e;
    this.windN = w.n;

    this.setStatus("connected");

    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  async disconnect(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.setStatus("disconnected");
  }

  /** TX console support — the sim acknowledges commands like real firmware
      would, including a SiK/RFD900-style AT command set so the Radio panel
      is fully demoable. */
  private atMode = false;
  private radioParams: Record<number, number> = { 1: 57, 2: 64, 3: 25, 4: 20, 6: 1 }; // S-registers: serial, air speed, netid, power, mavlink

  async write(line: string): Promise<void> {
    const cmd = line.trim().toUpperCase();
    setTimeout(() => {
      if (this.status !== "connected") return;

      // SiK / RFD900 AT command emulation
      if (cmd === "+++") { this.atMode = true; this.emitRaw("OK"); return; }
      if (this.atMode && cmd.startsWith("AT")) {
        if (cmd === "ATI") this.emitRaw("RFD SiK 2.65 on VX-SIM900");
        else if (cmd === "ATI5") {
          this.emitRaw("S1:SERIAL_SPEED=57");
          this.emitRaw(`S2:AIR_SPEED=${this.radioParams[2]}`);
          this.emitRaw(`S3:NETID=${this.radioParams[3]}`);
          this.emitRaw(`S4:TXPOWER=${this.radioParams[4]}`);
          this.emitRaw(`S6:MAVLINK=${this.radioParams[6]}`);
        } else if (cmd === "ATI7") this.emitRaw(`L/R RSSI: 208/195  L/R noise: 55/62  pkts: ${Math.round(this.simMs / 50)}`);
        else if (/^ATS(\d+)=(\d+)$/.test(cmd)) {
          const [, reg, val] = cmd.match(/^ATS(\d+)=(\d+)$/)!;
          this.radioParams[Number(reg)] = Number(val);
          this.emitRaw("OK");
        } else if (/^ATS(\d+)\?$/.test(cmd)) {
          const [, reg] = cmd.match(/^ATS(\d+)\?$/)!;
          this.emitRaw(String(this.radioParams[Number(reg)] ?? 0));
        } else if (cmd === "AT&W") this.emitRaw("OK");
        else if (cmd === "ATZ") { this.atMode = false; this.emitRaw("OK"); }
        else if (cmd === "ATO") { this.atMode = false; this.emitRaw("OK"); }
        else this.emitRaw("ERROR");
        return;
      }

      if (cmd === "PING") this.emitRaw("# PONG");
      else if (cmd === "STATUS") this.emitRaw(`# STATUS phase=${this.phase} batt=${this.battV.toFixed(2)}V alt=${this.lastAlt.toFixed(1)}m`);
      else if (cmd === "VERSION") this.emitRaw("# VX-SIM firmware 1.0.0");
      else this.emitRaw(`# ACK ${cmd}`);
    }, 120);
  }

  private emitRaw(line: string) {
    this.lineListeners.forEach((cb) => cb(line));
  }

  private pendingEvent: string | undefined;
  private lastAlt = 0;
  private lastVel = 0;

  // Physics-profile flight (user's rocket/motor/recovery/environment).
  private profile: SimProfile = loadSimProfile();
  private fs: FlightState | null = null;
  private windE = 0;
  private windN = 0;
  private eventQueue: string[] = [];
  private phaseT = 0; // seconds in the current phase (attitude animation)

  private tick() {
    this.simMs += TICK_MS * SIM_SPEED;
    const dtSec = (TICK_MS * SIM_SPEED) / 1000;
    const p = this.profile;

    let alt = 0;
    let vel = 0;
    const ax = 0, ay = 0;
    let az = G; // accel incl. gravity reaction; at rest ≈ +1 g

    const prevPhase = this.phase;

    // Pad sequence: ARM at T-2, ignition at T=3 s — then physics takes over.
    if (!this.fs) {
      const tPad = this.simMs / 1000;
      if (!this.armed && tPad >= 1) {
        this.armed = true;
        this.eventQueue.push("ARMED");
      }
      if (tPad >= 3) this.fs = initialFlightState(p);
      this.phase = "idle";
    }

    if (this.fs) {
      const st = stepFlight(this.fs, p, dtSec);
      for (const ev of st.events) {
        this.eventQueue.push(ev);
        if (ev === "APOGEE") this.drogueCont = 0; // drogue charge fires
        if (ev === "MAIN") this.mainCont = 0;     // main charge fires
        if (ev === "BURNOUT" && p.twoStage) {
          // Staging: spent booster separates onto its own tracker stream.
          this.booster = {
            phase: "coast",
            alt: st.altAgl,
            vel: st.vel * 0.85,
            posE: this.posE,
            posN: this.posN,
            pendingEvent: "SEPARATION",
          };
        }
      }

      alt = Math.max(0, st.altAgl);
      vel = st.vel;
      this.phase = st.phase === "pad" ? "idle" : st.phase;

      // Vertical accel signature per phase.
      if (this.phase === "boost") az = p.motor.avgThrustN / st.massKg;
      else if (this.phase === "coast") az = 0.7 * G;
      else az = G;
    }

    this.phaseT = this.phase === prevPhase ? this.phaseT + dtSec : 0;
    const dt = this.phaseT; // seconds in current phase (attitude animation)

    // DROGUE canopy event ~1 s after apogee (post phase-timer update).
    if (this.phase === "drogue" && !this.drogueEventSent && this.phaseT >= 1) {
      this.drogueEventSent = true;
      this.eventQueue.push("DROGUE");
    }

    if (!this.pendingEvent && this.eventQueue.length) {
      this.pendingEvent = this.eventQueue.shift();
    }

    this.lastAlt = alt;
    this.lastVel = vel;

    // slow battery drain over the flight
    this.battV = Math.max(6.6, 8.4 - this.simMs / 400000);

    // Horizontal drift under the configured wind: full push under canopy.
    const df = this.fs ? simDriftFactor(this.fs.phase) : 0;
    this.posE += this.windE * df * dtSec;
    this.posN += this.windN * df * dtSec;

    const lat = p.env.padLat + this.posN / M_PER_DEG_LAT;
    const lon = p.env.padLon + this.posE / (M_PER_DEG_LAT * Math.cos((p.env.padLat * Math.PI) / 180));

    const jitter = () => (Math.random() - 0.5) * 0.08;
    const gpsJitter = () => (Math.random() - 0.5) * 0.00002;

    // Environment from the International Standard Atmosphere (troposphere model),
    // referenced to the pad altitude so it reads realistically through the flight.
    const altAbs = p.env.padAltM + Math.max(0, alt);
    const temp_c = p.env.tempC - 0.0065 * Math.max(0, alt) + (Math.random() - 0.5) * 0.3;
    const pressure_pa = 101325 * Math.pow(1 - 2.25577e-5 * altAbs, 5.25588);
    const humidity_pct = Math.max(8, Math.min(95, 55 - alt / 60 + (Math.random() - 0.5) * 2));

    // Simulated attitude: roll about the long axis + phase-dependent tilt.
    // Identity quaternion = nose straight up.
    let tiltDeg = 0.4 * Math.sin(this.simMs / 900); // slight breathing on the pad
    let tiltAxisDeg = p.env.windDirDeg; // weathercock into the wind
    let spinRateDps = 0; // roll rate about the long axis, deg/s (emitted as gy)
    switch (this.phase) {
      case "boost":
        spinRateDps = 220;                       // fast roll under thrust
        tiltDeg = Math.min(4, dt * 2);           // small weathercock into the wind
        break;
      case "coast":
        spinRateDps = 50;                        // roll decays after burnout
        tiltDeg = Math.min(26, 4 + dt * 1.6);    // gravity turn builds
        break;
      case "drogue":
        spinRateDps = 18;
        tiltDeg = 14 * Math.sin(2 * Math.PI * 0.35 * dt); // pendulum swing under drogue
        tiltAxisDeg = 25 + dt * 30;                        // swing plane precesses
        break;
      case "main":
        spinRateDps = 6;
        tiltDeg = 6 * Math.sin(2 * Math.PI * 0.5 * dt);   // gentler swing under main
        tiltAxisDeg = 25 + dt * 15;
        break;
      case "landed":
        tiltDeg = 84; // resting on its side in the dirt
        tiltAxisDeg = 10;
        break;
    }
    this.spinDeg += spinRateDps * dtSec;
    const axR = (tiltAxisDeg * Math.PI) / 180;
    const q = qMul(qAxis(Math.cos(axR), 0, Math.sin(axR), tiltDeg), qAxis(0, 1, 0, this.spinDeg % 360));
    const r4 = (n: number) => Math.round(n * 10000) / 10000;

    /* --- Thrust vector control -----------------------------------------
       The gimbal only has authority while the motor is burning. A simple
       proportional law drives the commanded angle against the current tilt
       error; the servos track it through a first-order lag, which is what
       produces the command-vs-feedback gap the TVC widget plots. */
    const tvcActive = this.phase === "boost";
    const TVC_LIMIT = 10;       // matches the widget's mechanical limit
    const TVC_KP = 0.55;        // proportional gain
    const TVC_TAU = 0.05;       // servo time constant, seconds
    const clampTvc = (d: number) => Math.max(-TVC_LIMIT, Math.min(TVC_LIMIT, d));

    let tvcPitchCmd = 0;
    let tvcYawCmd = 0;
    if (tvcActive) {
      // Decompose the tilt vector onto the pitch/yaw gimbal axes, then oppose it.
      tvcPitchCmd = clampTvc(-TVC_KP * tiltDeg * Math.cos(axR) + (Math.random() - 0.5) * 0.15);
      tvcYawCmd = clampTvc(-TVC_KP * tiltDeg * Math.sin(axR) + (Math.random() - 0.5) * 0.15);
    }
    const lag = 1 - Math.exp(-dtSec / TVC_TAU);
    this.tvcPitchFb += (tvcPitchCmd - this.tvcPitchFb) * lag;
    this.tvcYawFb += (tvcYawCmd - this.tvcYawFb) * lag;

    this.seqSust += Math.random() < 0.015 ? 2 : 1; // occasional dropped packet
    const frame: Record<string, unknown> = {
      v: 1,
      vid: "SUST",
      seq: this.seqSust,
      t_ms: Math.round(this.simMs),
      alt_m: Math.round(Math.max(0, alt) * 100) / 100,
      vel_mps: Math.round(vel * 100) / 100,
      batt_v: Math.round(this.battV * 100) / 100,
      rssi_dbm: Math.round(-58 + (Math.random() - 0.5) * 6),
      ax: Math.round((ax + jitter()) * 1000) / 1000,
      ay: Math.round((ay + jitter()) * 1000) / 1000,
      az: Math.round((az + jitter()) * 1000) / 1000,
      gx: Math.round((Math.random() - 0.5) * 4 * 100) / 100,
      gy: Math.round((spinRateDps + (Math.random() - 0.5) * 6) * 100) / 100,
      gz: Math.round((Math.random() - 0.5) * 4 * 100) / 100,
      lat: Math.round((lat + gpsJitter()) * 1e6) / 1e6,
      lon: Math.round((lon + gpsJitter()) * 1e6) / 1e6,
      gps_fix: 3,
      gps_sats: 9 + Math.round((Math.random() - 0.5) * 2),
      gps_alt_m: Math.round((p.env.padAltM + Math.max(0, alt) + (Math.random() - 0.5) * 6) * 10) / 10,
      temp_c: Math.round(temp_c * 10) / 10,
      pressure_pa: Math.round(pressure_pa),
      humidity_pct: Math.round(humidity_pct),
      snr_db: Math.round(Math.max(1, 15 - Math.max(0, alt) / 250 + (Math.random() - 0.5) * 3) * 10) / 10,
      current_a:
        Math.round(
          ((this.phase === "boost" ? 0.95 : this.phase === "coast" ? 0.6 : this.phase === "idle" ? 0.35 : 0.5) +
            (Math.random() - 0.5) * 0.06) * 100
        ) / 100,
      q_w: r4(q.w), q_x: r4(q.x), q_y: r4(q.y), q_z: r4(q.z),
      tvc_enabled: tvcActive ? 1 : 0,
      tvc_pitch_deg: Math.round(tvcPitchCmd * 100) / 100,
      tvc_yaw_deg: Math.round(tvcYawCmd * 100) / 100,
      tvc_pitch_fb_deg: Math.round(this.tvcPitchFb * 100) / 100,
      tvc_yaw_fb_deg: Math.round(this.tvcYawFb * 100) / 100,
      pyro_drogue_cont: this.drogueCont,
      pyro_main_cont: this.mainCont,
    };

    if (this.pendingEvent) {
      frame.event = this.pendingEvent;
      this.pendingEvent = undefined;
    }

    const line = appendChecksum(JSON.stringify(frame));
    this.lineListeners.forEach((cb) => cb(line));

    this.tickBooster(dtSec);
  }

  /** Integrate + emit the separated booster's own tracker stream. */
  private tickBooster(dtSec: number) {
    const b = this.booster;
    if (!b) return;

    if (b.phase === "coast") {
      b.vel -= 32 * dtSec; // draggier without the sustainer's nose
      b.alt += b.vel * dtSec;
      if (b.vel <= 0) {
        b.phase = "descent";
        b.pendingEvent = "APOGEE";
      }
    } else if (b.phase === "descent") {
      b.vel = -22; // tumbling / drogue-less terminal-ish descent
      b.alt += b.vel * dtSec;
      b.posE += this.windE * 0.7 * dtSec;
      b.posN += this.windN * 0.7 * dtSec;
      if (b.alt <= 0) {
        b.alt = 0;
        b.vel = 0;
        b.phase = "landed";
        b.pendingEvent = "LANDING";
      }
    }
    // landed: keep beaconing for recovery

    const pe = this.profile.env;
    const lat = pe.padLat + b.posN / M_PER_DEG_LAT;
    const lon = pe.padLon + b.posE / (M_PER_DEG_LAT * Math.cos((pe.padLat * Math.PI) / 180));

    this.seqBstr += Math.random() < 0.03 ? 2 : 1; // weaker link drops more
    const frame: Record<string, unknown> = {
      v: 1,
      vid: "BSTR",
      seq: this.seqBstr,
      t_ms: Math.round(this.simMs),
      alt_m: Math.round(Math.max(0, b.alt) * 100) / 100,
      vel_mps: Math.round(b.vel * 100) / 100,
      batt_v: 7.9,
      rssi_dbm: Math.round(-72 - Math.max(0, b.alt) / 400 + (Math.random() - 0.5) * 6),
      snr_db: Math.round(Math.max(1, 10 - Math.max(0, b.alt) / 400 + (Math.random() - 0.5) * 2) * 10) / 10,
      lat: Math.round((lat + (Math.random() - 0.5) * 0.00002) * 1e6) / 1e6,
      lon: Math.round((lon + (Math.random() - 0.5) * 0.00002) * 1e6) / 1e6,
      gps_fix: 3,
      gps_sats: 8 + Math.round((Math.random() - 0.5) * 2),
      gps_alt_m: Math.round((this.profile.env.padAltM + Math.max(0, b.alt) + (Math.random() - 0.5) * 6) * 10) / 10,
    };
    if (b.pendingEvent) {
      frame.event = b.pendingEvent;
      b.pendingEvent = undefined;
    }
    const line = appendChecksum(JSON.stringify(frame));
    this.lineListeners.forEach((cb) => cb(line));
  }
}
