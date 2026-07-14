import type { MotorSpec } from "./flightSim";

/**
 * Motor & rocket file import.
 *
 *  - RASP `.eng`  : the de-facto motor thrust-curve format (thrustcurve.org).
 *  - RockSim `.rse`: XML thrust curves, one or more <engine> per file.
 *  - OpenRocket `.ork`: a ZIP of `rocket.ork` XML — best-effort extraction of
 *    reference diameter, selected motor, and any mass override.
 *
 * All parsers are offline and dependency-free. Imported motors carry their real
 * `curve`, so the flight sim integrates the actual thrust profile.
 */

/* ---------------- RASP .eng ---------------- */

/**
 * .eng format: comment lines start with ';'. The first data line is the header:
 *   <designation> <diam_mm> <len_mm> <delays> <propMass_kg> <totalMass_kg> <mfg>
 * followed by "<time_s> <thrust_N>" pairs, terminated by a line with thrust 0.
 */
export function parseEng(text: string): MotorSpec {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith(";"));
  if (!lines.length) throw new Error("Empty .eng file");

  const header = lines[0].split(/\s+/);
  if (header.length < 7) throw new Error("Malformed .eng header line");
  const designation = header[0];
  const propKg = Number(header[4]);
  const mfg = header.slice(6).join(" ");

  const curve: Array<[number, number]> = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/).map(Number);
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      curve.push([parts[0], parts[1]]);
    }
  }
  if (curve.length < 2) throw new Error("No thrust-curve data points found");
  if (curve[0][0] > 0) curve.unshift([0, 0]); // ensure it starts at t=0

  return motorFromCurve(designation, mfg, Number.isFinite(propKg) ? propKg : estimatePropMass(curve), curve);
}

/* ---------------- RockSim .rse ---------------- */

export function parseRse(xml: string): MotorSpec[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Invalid .rse XML");
  const engines = Array.from(doc.querySelectorAll("engine"));
  if (!engines.length) throw new Error("No <engine> elements in .rse");

  return engines.map((eng) => {
    const code = eng.getAttribute("code") || eng.getAttribute("Code") || "Motor";
    const mfg = eng.getAttribute("mfg") || eng.getAttribute("Mfg") || "";
    const propKgAttr = Number(eng.getAttribute("propWt") || eng.getAttribute("PropWt")); // grams in RockSim
    const curve: Array<[number, number]> = [];
    eng.querySelectorAll("eng-data, engdata").forEach((d) => {
      const t = Number(d.getAttribute("t"));
      const f = Number(d.getAttribute("f"));
      if (Number.isFinite(t) && Number.isFinite(f)) curve.push([t, f]);
    });
    if (curve.length < 2) throw new Error(`Motor ${code} has no thrust data`);
    if (curve[0][0] > 0) curve.unshift([0, 0]);
    const propKg = Number.isFinite(propKgAttr) && propKgAttr > 0 ? propKgAttr / 1000 : estimatePropMass(curve);
    return motorFromCurve(code, mfg, propKg, curve);
  });
}

/* ---------------- Shared ---------------- */

function motorFromCurve(designation: string, mfg: string, propKg: number, curve: Array<[number, number]>): MotorSpec {
  const burnS = curve[curve.length - 1][0];
  let impulse = 0;
  for (let i = 1; i < curve.length; i++) {
    impulse += ((curve[i - 1][1] + curve[i][1]) / 2) * (curve[i][0] - curve[i - 1][0]);
  }
  const avgThrustN = burnS > 0 ? impulse / burnS : 0;
  const name = `${designation}${mfg ? ` (${mfg})` : ""}`;
  return { name, impulseNs: Math.round(impulse), avgThrustN: Math.round(avgThrustN), burnS, propKg, curve };
}

/** Rough propellant-mass fallback from total impulse (~200 Ns/kg Isp·g). */
function estimatePropMass(curve: Array<[number, number]>): number {
  let impulse = 0;
  for (let i = 1; i < curve.length; i++) impulse += ((curve[i - 1][1] + curve[i][1]) / 2) * (curve[i][0] - curve[i - 1][0]);
  return Math.max(0.02, impulse / 2000); // ~2000 Ns/kg for composite APCP
}

/* ---------------- User motor store ---------------- */

const KEY = "vx.userMotors";

export function getUserMotors(): MotorSpec[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as MotorSpec[];
  } catch {
    return [];
  }
}

export function saveUserMotors(motors: MotorSpec[]) {
  localStorage.setItem(KEY, JSON.stringify(motors));
}

/** Add (or replace by name) imported motors; returns the merged list. */
export function addUserMotors(motors: MotorSpec[]): MotorSpec[] {
  const existing = getUserMotors().filter((m) => !motors.some((n) => n.name === m.name));
  const merged = [...existing, ...motors];
  saveUserMotors(merged);
  return merged;
}

export function removeUserMotor(name: string): MotorSpec[] {
  const next = getUserMotors().filter((m) => m.name !== name);
  saveUserMotors(next);
  return next;
}

/* ---------------- OpenRocket .ork (best-effort) ---------------- */

export type OrkImport = {
  diameterMm?: number;
  dryKg?: number;
  motorDesignation?: string;
  name?: string;
  note: string;
};

/**
 * Extract what we reliably can from an OpenRocket .ork (a ZIP containing
 * rocket.ork XML): reference diameter, a mass override if the design has one,
 * and the mounted motor designation. Mass is otherwise computed by OpenRocket's
 * component model, which we don't reproduce — so we flag it for the user.
 */
export async function parseOrk(buf: ArrayBuffer): Promise<OrkImport> {
  const xml = await unzipFirstXml(buf);
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Could not read rocket.ork XML");

  const name = doc.querySelector("rocket > name")?.textContent?.trim() || undefined;

  // Reference diameter: the largest body-tube / transition outer radius.
  let maxRadius = 0;
  doc.querySelectorAll("bodytube radius, transition aftradius, transition foreradius, nosecone aftradius").forEach((el) => {
    const r = Number(el.textContent);
    if (Number.isFinite(r) && r > maxRadius) maxRadius = r;
  });
  const diameterMm = maxRadius > 0 ? Math.round(maxRadius * 2000) : undefined; // meters → mm

  // Mass override, if the designer set one anywhere (summed).
  let overrideKg = 0;
  doc.querySelectorAll("[overridemass], overridemass").forEach((el) => {
    const v = Number(el.getAttribute?.("overridemass") ?? el.textContent);
    if (Number.isFinite(v)) overrideKg += v;
  });

  // Mounted motor designation.
  const motorDesignation = doc.querySelector("motor > designation, motor designation")?.textContent?.trim() || undefined;

  const missing: string[] = [];
  if (!diameterMm) missing.push("diameter");
  if (!overrideKg) missing.push("mass (OpenRocket computes it from components — set dry mass by hand)");
  const note = missing.length ? `Imported ${name ?? "rocket"}. Verify: ${missing.join(", ")}.` : `Imported ${name ?? "rocket"}.`;

  return { diameterMm, dryKg: overrideKg > 0 ? overrideKg : undefined, motorDesignation, name, note };
}

/** Minimal ZIP reader: find the first `.ork`/`.xml` entry and inflate it using
    the platform's DecompressionStream (deflate-raw). No external deps. */
async function unzipFirstXml(buf: ArrayBuffer): Promise<string> {
  const dv = new DataView(buf);
  const bytes = new Uint8Array(buf);
  // Scan local file headers (signature 0x04034b50).
  for (let i = 0; i + 30 < bytes.length; i++) {
    if (dv.getUint32(i, true) !== 0x04034b50) continue;
    const method = dv.getUint16(i + 8, true);
    const compSize = dv.getUint32(i + 18, true);
    const nameLen = dv.getUint16(i + 26, true);
    const extraLen = dv.getUint16(i + 28, true);
    const nameStart = i + 30;
    const fname = new TextDecoder().decode(bytes.subarray(nameStart, nameStart + nameLen));
    const dataStart = nameStart + nameLen + extraLen;
    if (!/\.(ork|xml)$/i.test(fname)) continue;
    const comp = bytes.subarray(dataStart, dataStart + compSize);
    if (method === 0) return new TextDecoder().decode(comp); // stored
    if (method === 8) return inflateRaw(comp); // deflate
    throw new Error("Unsupported ZIP compression in .ork");
  }
  throw new Error("No rocket.ork found inside the .ork archive");
}

async function inflateRaw(bytes: Uint8Array): Promise<string> {
  if (typeof (globalThis as any).DecompressionStream !== "function") {
    throw new Error("This browser can't inflate .ork — try the .eng/.rse motor import instead");
  }
  const ds = new (globalThis as any).DecompressionStream("deflate-raw");
  const stream = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(ds));
  return new TextDecoder().decode(await stream.arrayBuffer());
}
