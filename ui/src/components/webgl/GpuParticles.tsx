/**
 * GpuParticles — GPU 粒子系统
 *
 * 使用 Points + BufferGeometry + 自定义 Shader
 * - 数千粒子在 GPU 中更新（不重传 buffer）
 * - 三色品牌粒子 + 大小 / 透明度变化
 * - 鼠标视差（射线扰动）
 * - 上升漂浮 + 周期闪烁
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GpuParticlesProps {
  count?: number;
  size?: number;
}

const VERT = /* glsl */ `
  attribute float aSize;
  attribute float aSpeed;
  attribute float aOffset;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uBounds;

  void main() {
    vColor = aColor;
    vec3 pos = position;

    // 向上漂浮
    float t = uTime * aSpeed + aOffset;
    pos.y = mod(pos.y + t * 0.4, uBounds.y * 2.0) - uBounds.y;
    pos.x += sin(t * 0.7 + aOffset) * 0.3;
    pos.z += cos(t * 0.5 + aOffset * 1.3) * 0.2;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // 大小随距离衰减
    gl_PointSize = aSize * uPixelRatio * (40.0 / -mvPosition.z);

    // 闪烁
    vAlpha = 0.5 + 0.5 * sin(t * 2.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    // 软圆 + 发光
    float core = smoothstep(0.5, 0.0, d);
    float glow = smoothstep(0.5, 0.15, d) * 0.5;
    vec3 col = vColor * (core + glow);
    gl_FragColor = vec4(col, (core + glow * 0.6) * vAlpha);
  }
`;

const COLORS = [
  new THREE.Color("#7C3AED"),
  new THREE.Color("#00E5FF"),
  new THREE.Color("#FF2D95"),
  new THREE.Color("#00FFB2"),
  new THREE.Color("#FFFFFF"),
];

export default function GpuParticles({
  count = 2000,
  size = 1.0,
}: GpuParticlesProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const bounds = useMemo(() => new THREE.Vector2(14, 8), []);

  const { positions, colors, sizes, speeds, offsets } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * bounds.x * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * bounds.y * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * 10 - 2;

      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = (Math.random() * 0.6 + 0.4) * size * 8;
      speeds[i] = Math.random() * 0.6 + 0.2;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    return { positions, colors, sizes, speeds, offsets };
  }, [count, size, bounds]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
      uBounds: { value: bounds },
    }),
    [bounds],
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
        <bufferAttribute attach="attributes-aOffset" args={[offsets, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
