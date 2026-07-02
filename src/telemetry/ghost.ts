import type { TelemetryFrameV1 } from "./types";

/**
 * Flight comparison overlay ("ghost"): a reference flight's frames,
 * time-shifted so its liftoff aligns with the current flight's. Held in a
 * module store so plot components can read it without threading props through
 * every widget layer; a version counter lets render memos invalidate.
 */

export type GhostData = { name: string; frames: TelemetryFrameV1[] } | null;

let ghost: GhostData = null;
let version = 0;

export function setGhost(g: GhostData) {
  ghost = g;
  version++;
}

export function getGhost(): GhostData {
  return ghost;
}

export function getGhostVersion(): number {
  return version;
}
