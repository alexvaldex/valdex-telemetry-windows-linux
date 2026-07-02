import { pushFrame, pushRawLine, type TelemetryState } from "./store";
import { normalizeTelemetryFrame } from "./schema";
import { isTelemetryFrameV1 } from "./validate";
import { applyFieldMap, trackUnknownKeys } from "./fieldMap";

export function ingestLine(state: TelemetryState, line: string): TelemetryState {
  let next = pushRawLine(state, line);

  let raw: unknown;
  try {
    raw = JSON.parse(line);
  } catch {
    return next;
  }

  // User-defined firmware field remapping, then record unmapped keys for the UI.
  raw = applyFieldMap(raw as Record<string, unknown>);
  trackUnknownKeys(raw as Record<string, unknown>);

  const frame = normalizeTelemetryFrame(raw as Record<string, unknown>, Date.now());
  if (!frame || !isTelemetryFrameV1(frame)) return next;

  next = pushFrame(next, frame);
  return next;
}
