import type { Connection, ConnectOptions, ConnectionStatus } from "./types";

type Phase = "idle" | "boost" | "coast" | "drogue" | "main" | "landed";

const G = 9.81;
const BOOST_ACCEL = 100; // net m/s^2 during motor burn
const BOOST_DURATION_S = 2.5;
const COAST_DECEL = 25; // m/s^2 (gravity + drag) during coast to apogee
const DROGUE_VEL = -20; // m/s
const MAIN_DEPLOY_ALT_M = 300;
const MAIN_VEL = -5; // m/s
const TICK_MS = 50; // 20Hz emission rate
const SIM_SPEED = 6; // sim-seconds per real-second, so a full flight plays out in ~20-30s

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

    this.setStatus("connected");

    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  async disconnect(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.setStatus("disconnected");
  }

  private pendingEvent: string | undefined;
  private lastAlt = 0;
  private lastVel = 0;

  private tick() {
    this.simMs += TICK_MS * SIM_SPEED;
    const dt = (this.simMs - this.phaseStartMs) / 1000; // seconds into current phase

    let alt = this.phaseStartAlt;
    let vel = this.phaseStartVel;
    let ax = 0, ay = 0, az = G; // accel including gravity reaction, at rest az ~= +1g

    switch (this.phase) {
      case "idle": {
        if (!this.armed && dt >= 1) {
          this.armed = true;
          this.pendingEvent = "ARMED";
        }
        if (dt >= 3) {
          this.pendingEvent = "LIFTOFF";
          this.phase = "boost";
          this.phaseStartMs = this.simMs;
          alt = 0;
          vel = 0;
        }
        break;
      }
      case "boost": {
        if (dt <= BOOST_DURATION_S) {
          vel = this.phaseStartVel + BOOST_ACCEL * dt;
          alt = this.phaseStartAlt + this.phaseStartVel * dt + 0.5 * BOOST_ACCEL * dt * dt;
          az = G + BOOST_ACCEL;
        } else {
          this.pendingEvent = "BURNOUT";
          this.phase = "coast";
          this.phaseStartMs = this.simMs - (dt - BOOST_DURATION_S) * 1000;
          this.phaseStartAlt = this.lastAlt;
          this.phaseStartVel = this.lastVel;
          alt = this.phaseStartAlt;
          vel = this.phaseStartVel;
        }
        break;
      }
      case "coast": {
        vel = this.phaseStartVel - COAST_DECEL * dt;
        if (vel <= 0) {
          const tApogee = this.phaseStartVel / COAST_DECEL;
          alt = this.phaseStartAlt + this.phaseStartVel * tApogee - 0.5 * COAST_DECEL * tApogee * tApogee;
          vel = 0;
          this.pendingEvent = "APOGEE";
          this.phase = "drogue";
          this.phaseStartMs = this.simMs;
          this.phaseStartAlt = alt;
          this.phaseStartVel = DROGUE_VEL;
        } else {
          alt = this.phaseStartAlt + this.phaseStartVel * dt - 0.5 * COAST_DECEL * dt * dt;
        }
        az = 0.7 * G; // light deceleration signature under thrust-free coast
        break;
      }
      case "drogue": {
        vel = DROGUE_VEL;
        alt = this.phaseStartAlt + DROGUE_VEL * dt;
        az = G;
        if (alt <= MAIN_DEPLOY_ALT_M) {
          alt = MAIN_DEPLOY_ALT_M;
          this.pendingEvent = "MAIN";
          this.phase = "main";
          this.phaseStartMs = this.simMs;
          this.phaseStartAlt = alt;
          this.phaseStartVel = MAIN_VEL;
        }
        break;
      }
      case "main": {
        vel = MAIN_VEL;
        alt = this.phaseStartAlt + MAIN_VEL * dt;
        az = G;
        if (alt <= 0) {
          alt = 0;
          vel = 0;
          this.pendingEvent = "LANDING";
          this.phase = "landed";
          this.phaseStartMs = this.simMs;
          this.phaseStartAlt = 0;
          this.phaseStartVel = 0;
        }
        break;
      }
      case "landed": {
        alt = 0;
        vel = 0;
        az = G;
        break;
      }
    }

    this.lastAlt = alt;
    this.lastVel = vel;

    // slow battery drain over the flight
    this.battV = Math.max(6.6, 8.4 - this.simMs / 400000);

    const jitter = () => (Math.random() - 0.5) * 0.08;

    const frame: Record<string, unknown> = {
      v: 1,
      t_ms: Math.round(this.simMs),
      alt_m: Math.round(Math.max(0, alt) * 100) / 100,
      vel_mps: Math.round(vel * 100) / 100,
      batt_v: Math.round(this.battV * 100) / 100,
      rssi_dbm: Math.round(-58 + (Math.random() - 0.5) * 6),
      ax: Math.round((ax + jitter()) * 1000) / 1000,
      ay: Math.round((ay + jitter()) * 1000) / 1000,
      az: Math.round((az + jitter()) * 1000) / 1000,
    };

    if (this.pendingEvent) {
      frame.event = this.pendingEvent;
      this.pendingEvent = undefined;
    }

    const line = JSON.stringify(frame);
    this.lineListeners.forEach((cb) => cb(line));
  }
}
