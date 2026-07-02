import { MAX_FRAMES, MAX_RAW_LINES, type TelemetryState } from "./store";
import { normalizeTelemetryFrame } from "./schema";
import { isTelemetryFrameV1 } from "./validate";
import { applyFieldMap, trackUnknownKeys } from "./fieldMap";

/**
 * Hot-path ingest: mutates the given state's arrays in place (no per-line
 * allocation). Used by the live store, which snapshots at its UI tick rate
 * instead of per line — at 20–40 Hz across multiple streams this matters.
 */
export function ingestLineInPlace(state: TelemetryState, line: string): void {
  state.rawLines.push(line);
  if (state.rawLines.length > MAX_RAW_LINES) state.rawLines.shift();

  let raw: unknown;
  try {
    raw = JSON.parse(line);
  } catch {
    return;
  }

  // User-defined firmware field remapping, then record unmapped keys for the UI.
  raw = applyFieldMap(raw as Record<string, unknown>);
  trackUnknownKeys(raw as Record<string, unknown>);

  const frame = normalizeTelemetryFrame(raw as Record<string, unknown>, Date.now());
  if (!frame || !isTelemetryFrameV1(frame)) return;

  state.frames.push(frame);
  if (state.frames.length > MAX_FRAMES) state.frames.shift();
  state.latest = frame;
}

/** Pure variant (playback, tests): returns a new state, original untouched. */
export function ingestLine(state: TelemetryState, line: string): TelemetryState {
  const next: TelemetryState = {
    connected: state.connected,
    latest: state.latest,
    frames: [...state.frames],
    rawLines: [...state.rawLines],
  };
  ingestLineInPlace(next, line);
  return next;
}
