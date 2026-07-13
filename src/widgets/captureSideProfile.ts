import * as THREE from "three";
import { loadModelObject, normalizeModel, type Model3D, type UpAxis } from "./rocketModel";

/**
 * Render an uploaded CAD model to a flat 2D side silhouette (PNG data URL) for
 * use as the vehicle marker in the Mission Model. The model is oriented nose-up
 * (+Y), viewed orthographically from the side, and drawn as a solid silhouette
 * on a transparent background so it reads cleanly at ~30px.
 *
 * Returns the data URL plus the width/height aspect ratio so the caller can
 * size the <image> without distortion.
 */
export async function captureSideProfile(
  model: Model3D,
  upAxis: UpAxis
): Promise<{ dataUrl: string; aspect: number }> {
  const obj = await loadModelObject(model);
  const group = normalizeModel(obj, upAxis, 1.4);

  // Flatten every mesh to a solid silhouette color (a shaded render is muddy
  // at marker size; a clean fill reads as a rocket).
  const silhouette = new THREE.MeshBasicMaterial({ color: "#d8dbe0" });
  group.traverse((c: any) => {
    if (c?.isMesh) c.material = silhouette;
  });

  const scene = new THREE.Scene();
  scene.add(group);

  // Measure the oriented, scaled model.
  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  box.getSize(size);
  const w = size.x || 1;
  const h = size.y || 1;
  const depth = size.z || 1;
  const aspect = w / h;

  // Orthographic side camera looking down −Z, framed to the model with margin.
  const pad = 1.08;
  const cam = new THREE.OrthographicCamera(
    (-w / 2) * pad, (w / 2) * pad,
    (h / 2) * pad, (-h / 2) * pad,
    0.01, depth * 4 + 10
  );
  cam.position.set(0, 0, depth * 2 + 2);
  cam.up.set(0, 1, 0);
  cam.lookAt(0, 0, 0);

  // Output canvas: fixed height, width by aspect (bounded so a thin airframe
  // still yields a usable bitmap).
  const H = 256;
  const W = Math.max(24, Math.min(H, Math.round(H * aspect)));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0); // transparent
  renderer.setSize(W, H, false);

  try {
    renderer.render(scene, cam);
    const dataUrl = canvas.toDataURL("image/png");
    return { dataUrl, aspect };
  } finally {
    renderer.dispose();
    silhouette.dispose();
  }
}

const SIDE_IMG_KEY = "vx.vehicleSideImage";
const SIDE_AR_KEY = "vx.vehicleSideImageAR";

/** Persist the captured profile where the Mission Model reads it. */
export function saveSideProfile(dataUrl: string, aspect: number) {
  localStorage.setItem(SIDE_IMG_KEY, dataUrl);
  localStorage.setItem(SIDE_AR_KEY, String(aspect));
}

export function clearSideProfile() {
  localStorage.removeItem(SIDE_IMG_KEY);
  localStorage.removeItem(SIDE_AR_KEY);
}

export function hasSideProfile(): boolean {
  return !!localStorage.getItem(SIDE_IMG_KEY);
}
