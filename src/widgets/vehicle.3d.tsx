import * as THREE from "three";
import React, { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

type Model3D = {
  name: string;
  mime: string;
  dataUrl: string; // base64 data url
  uploadedAt: number;
};

function readStoredModel(): Model3D | null {
  try {
    const raw = localStorage.getItem("vx.model3d");
    return raw ? (JSON.parse(raw) as Model3D) : null;
  } catch {
    return null;
  }
}

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(base64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function loadFromStoredModel(model: Model3D): Promise<THREE.Object3D> {
  const name = model.name.toLowerCase();

  // Prefer extension over mime.
  if (name.endsWith(".glb") || name.endsWith(".gltf")) {
    const loader = new GLTFLoader();
    const ab = dataUrlToArrayBuffer(model.dataUrl);
    const blobUrl = URL.createObjectURL(new Blob([ab], { type: "model/gltf-binary" }));
    try {
      const gltf = await loader.loadAsync(blobUrl);
      return gltf.scene;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  if (name.endsWith(".stl")) {
    const loader = new STLLoader();
    const ab = dataUrlToArrayBuffer(model.dataUrl);
    const geom = loader.parse(ab);
    geom.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ metalness: 0.1, roughness: 0.6 });
    return new THREE.Mesh(geom, mat);
  }

  if (name.endsWith(".obj")) {
    const loader = new OBJLoader();
    const ab = dataUrlToArrayBuffer(model.dataUrl);
    const text = new TextDecoder().decode(new Uint8Array(ab));
    const obj = loader.parse(text);
    obj.traverse((c: any) => {
      if (c?.isMesh && !c.material) c.material = new THREE.MeshStandardMaterial({ metalness: 0.1, roughness: 0.7 });
    });
    return obj;
  }

  throw new Error("Unsupported model format. Use .glb/.gltf (recommended), .stl, or .obj");
}

function centerAndScale(obj: THREE.Object3D, targetSize = 1.0) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  obj.position.sub(center); // center at origin

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? targetSize / maxDim : 1;
  obj.scale.setScalar(scale);
}

function DefaultRocket() {
  // Simple placeholder rocket: cylinder + cone
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 24]} />
        <meshStandardMaterial metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <coneGeometry args={[0.09, 0.22, 24]} />
        <meshStandardMaterial metalness={0.2} roughness={0.55} />
      </mesh>
    </group>
  );
}

function UploadedOrDefaultModel() {
  const [obj, setObj] = useState<THREE.Object3D | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Reload when localStorage changes (Settings upload)
  useEffect(() => {
    let alive = true;

    async function run() {
      setErr(null);
      const m = readStoredModel();
      if (!m) {
        setObj(null);
        return;
      }
      try {
        const loaded = await loadFromStoredModel(m);
        centerAndScale(loaded, 1.2);
        if (alive) setObj(loaded);
      } catch (e: any) {
        if (alive) {
          setObj(null);
          setErr(e?.message ?? "Failed to load model");
        }
      }
    }

    run();

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "vx.model3d") run();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      alive = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (err) {
    return (
      <group>
        <DefaultRocket />
        {/* you can also surface this string in your widget UI */}
      </group>
    );
  }

  if (!obj) return <DefaultRocket />;
  return <primitive object={obj} />;
}