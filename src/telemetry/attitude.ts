/** Attitude helpers shared by widgets. Lives outside `widgets/renderers.tsx`
    so widget modules can use it without importing the renderer barrel back
    (which would create an import cycle). */

/** Off-vertical tilt in degrees: angle between the body long axis (+Y) and
    world up. 0° = pointing straight up. */
export function tiltDegFromQuat(qw?: number, qx?: number, qy?: number, qz?: number): number | null {
  if (![qw, qx, qy, qz].every((n) => typeof n === "number" && Number.isFinite(n))) return null;
  const x = qx as number, z = qz as number;
  const upY = 1 - 2 * (x * x + z * z); // Y component of the rotated body-Y axis
  return (Math.acos(Math.max(-1, Math.min(1, upY))) * 180) / Math.PI;
}
