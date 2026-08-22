/**
 * Scene — WebGL 主场景容器
 *
 * 由 Canvas + R3F 组合：
 *   - AuroraPlane（极光着色器全屏背景）
 *   - GpuParticles（数千 GPU 粒子）
 *   - FloatingShards（Fresnel 浮动碎片）
 *   - ScrollCamera（滚动驱动相机）
 *   - PostFX（后期处理）
 *
 * 根据 PerfConfig 自动降级。
 * 低端设备（tier 0）不渲染 Canvas，回落到 CSS 背景。
 */
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import AuroraPlane from "./AuroraPlane";
import GpuParticles from "./GpuParticles";
import FloatingShards from "./FloatingShards";
import ScrollCamera from "./ScrollCamera";
import PostFX from "./PostFX";
import type { PerfConfig } from "@/hooks/usePerformanceTier";

interface SceneProps {
  config: PerfConfig;
}

export default function Scene({ config }: SceneProps) {
  if (!config.webgl) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        dpr={config.dpr}
        camera={{ position: [0, 0, 8], fov: 55, near: 0.1, far: 100 }}
        onCreated={({ gl }) => {
          gl.setClearColor("#05070D", 0);
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Suspense fallback={null}>
          {/* 灯光（虽然 shader 自发光，但为碎片提供基础光照） */}
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.6} color="#7C3AED" />
          <pointLight position={[-5, -3, 2]} intensity={0.4} color="#00E5FF" />

          {/* 极光着色器背景 */}
          <AuroraPlane intensity={1.0} mouseInfluence={0.5} />

          {/* GPU 粒子 */}
          {config.particles > 0 && (
            <GpuParticles count={config.particles} size={1} />
          )}

          {/* 浮动碎片 */}
          {config.shards > 0 && <FloatingShards count={config.shards} />}

          {/* 滚动驱动相机 */}
          <ScrollCamera />

          {/* 后期处理 */}
          <PostFX config={config} />
        </Suspense>
      </Canvas>
    </div>
  );
}
