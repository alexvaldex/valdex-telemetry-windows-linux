export type UnitSystem = "metric" | "imperial";

export const m_to_ft = (m: number) => m * 3.280839895;
export const mps_to_fps = (mps: number) => mps * 3.280839895;
export const mps_to_mph = (mps: number) => mps * 2.236936292;

export const c_to_f = (c: number) => (c * 9) / 5 + 32;
export const pa_to_hpa = (pa: number) => pa / 100;
export const pa_to_psi = (pa: number) => pa * 0.00014503773773;

export function fmt(n: number, digits = 2) {
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
}

export function altitudeDisplay(m: number, system: UnitSystem) {
  return system === "imperial"
    ? { value: m_to_ft(m), unit: "ft" as const }
    : { value: m, unit: "m" as const };
}

export function speedDisplay(mps: number, system: UnitSystem) {
  return system === "imperial"
    ? { value: mps_to_mph(mps), unit: "mph" as const }
    : { value: mps, unit: "m/s" as const };
}

export function accelDisplay(mps2: number, system: UnitSystem) {
  // keep m/s² for both; most flyers understand it. If you want g later, add it.
  return { value: mps2, unit: "m/s²" as const };
}

export function tempDisplay(c: number, system: UnitSystem) {
  return system === "imperial"
    ? { value: c_to_f(c), unit: "°F" as const }
    : { value: c, unit: "°C" as const };
}