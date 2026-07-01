import { initialTelemetryState, type TelemetryState } from "./store";
import { ingestLine } from "./ingest";

export type LiveState = TelemetryState & {
  connected: boolean;
  packetsPerSec: number;
};

const TICK_MS = 60; // ~16Hz UI tick, decoupled from ingest rate

function snapshotOf(state: TelemetryState, connected: boolean, packetsPerSec: number): LiveState {
  return { ...state, connected, packetsPerSec };
}

class LiveStore {
  private pending: TelemetryState = initialTelemetryState();
  private connected = false;
  private dirty = false;
  private frameTimestamps: number[] = [];
  private snapshot: LiveState = snapshotOf(this.pending, false, 0);
  private listeners = new Set<() => void>();

  constructor() {
    setInterval(() => this.flush(), TICK_MS);
  }

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  getState = (): LiveState => this.snapshot;

  ingest(line: string) {
    this.pending = ingestLine(this.pending, line);
    this.frameTimestamps.push(performance.now());
    this.dirty = true;
  }

  setConnected(connected: boolean) {
    this.connected = connected;
    this.dirty = true;
  }

  reset() {
    this.pending = initialTelemetryState();
    this.frameTimestamps = [];
    this.dirty = true;
  }

  private flush() {
    const now = performance.now();
    this.frameTimestamps = this.frameTimestamps.filter((t) => now - t <= 1000);
    const packetsPerSec = this.frameTimestamps.length;

    if (!this.dirty && packetsPerSec === this.snapshot.packetsPerSec) return;

    this.snapshot = snapshotOf(this.pending, this.connected, packetsPerSec);
    this.dirty = false;
    this.listeners.forEach((cb) => cb());
  }
}

export const liveStore = new LiveStore();
