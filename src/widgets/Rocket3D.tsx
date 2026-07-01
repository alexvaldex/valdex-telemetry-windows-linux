import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

/**
 * Quaternion-driven 3D rocket. Isolated in its own module so the heavy
 * three.js / react-three-fiber dependency tree is code-split and only
 * downloaded when a 3D widget is actually shown.
 */
export default function Rocket3D(props: { q: { w: number; x: number; y: number; z: number } | null }) {
  // three.js uses (x,y,z,w)
  const quat = props.q ? ([props.q.x, props.q.y, props.q.z, props.q.w] as [number, number, number, number]) : null;

  return (
    <div style={{ height: "100%", minHeight: 260, borderRadius: 3, overflow: "hidden", border: "1px solid var(--vx-line)" }}>
      <Canvas camera={{ position: [2.6, 1.6, 2.6], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 6, 4]} intensity={0.9} />

        {/* grid */}
        <gridHelper args={[10, 20, "rgba(255,255,255,0.18)" as any, "rgba(255,255,255,0.08)" as any]} />

        {/* rocket group */}
        <group quaternion={quat ? (quat as any) : undefined}>
          {/* body */}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 24]} />
            <meshStandardMaterial color={"#cfd6e6"} metalness={0.25} roughness={0.45} />
          </mesh>

          {/* nose */}
          <mesh position={[0, 1.25, 0]}>
            <coneGeometry args={[0.09, 0.3, 24]} />
            <meshStandardMaterial color={"#e9eefc"} metalness={0.15} roughness={0.35} />
          </mesh>

          {/* fins */}
          {[0, 120, 240].map((deg) => (
            <mesh key={deg} rotation={[0, (deg * Math.PI) / 180, 0]} position={[0.11, 0.1, 0]}>
              <boxGeometry args={[0.02, 0.18, 0.22]} />
              <meshStandardMaterial color={"#7aa2ff"} metalness={0.2} roughness={0.5} />
            </mesh>
          ))}

          {/* axis indicator */}
          <axesHelper args={[0.6]} />
        </group>

        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
