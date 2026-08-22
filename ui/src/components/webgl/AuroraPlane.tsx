/**
 * AuroraPlane — 极光着色器平面
 *
 * 全屏 plane，使用自定义 GLSL Shader 渲染流动极光：
 * - fbm 噪声叠加形成柔光带
 * - 鼠标位置扰动光带位置
 * - 4 色品牌渐变（紫 / 青 / 品红 / 薄荷）
 * - 远景星空 + 月亮辉光
 */
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface AuroraPlaneProps {
  mouseInfluence?: number;
  intensity?: number;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uIntensity;
  uniform vec2  uResolution;

  // 品牌色
  const vec3 C_VIOLET = vec3(0.486, 0.227, 0.929); // #7C3AED
  const vec3 C_CYAN   = vec3(0.0,   0.898, 1.0);   // #00E5FF
  const vec3 C_PINK   = vec3(1.0,   0.176, 0.584); // #FF2D95
  const vec3 C_MINT   = vec3(0.0,   1.0,   0.698); // #00FFB2
  const vec3 C_INK    = vec3(0.020, 0.027, 0.051); // #05070D

  // hash & noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uResolution.x / uResolution.y;

    // 鼠标扰动
    vec2 m = uMouse * 2.0 - 1.0;
    m.x *= uResolution.x / uResolution.y;
    float mDist = length(p - m);

    float t = uTime * 0.05;

    // 极光带：使用 fbm 制造流动光带
    float band1 = fbm(vec2(p.x * 1.4 + t, p.y * 2.2 - t * 1.3));
    float band2 = fbm(vec2(p.x * 2.0 - t * 0.8, p.y * 1.6 + t * 0.7));

    // 主光带 - 上半部分
    float top = smoothstep(0.0, 1.0, band1 * 0.8 + 0.2);
    float topMask = smoothstep(0.0, 0.7, 1.0 - abs(p.y - 0.3) * 1.4);
    vec3 topColor = mix(C_VIOLET, C_CYAN, band2);
    topColor = mix(topColor, C_PINK, smoothstep(0.4, 0.9, band1) * 0.5);

    // 底部光晕 - 紫红
    float bottom = smoothstep(0.0, 1.0, band2 * 0.7 + 0.3);
    float botMask = smoothstep(0.0, 0.6, abs(p.y + 0.6) * 1.2);
    vec3 botColor = mix(C_VIOLET, C_PINK, band1 * 0.6);

    // 鼠标光斑
    float mouseGlow = smoothstep(0.6, 0.0, mDist) * 0.5;
    vec3 mouseColor = mix(C_CYAN, C_MINT, 0.5);

    // 星空（远处）
    float starsField = noise(uv * 200.0);
    float stars = step(0.985, starsField) * smoothstep(0.0, 0.3, 1.0 - abs(p.y));

    // 月亮辉光（右上）
    vec2 moonPos = vec2(0.7, 0.45);
    float moonDist = length(p - moonPos);
    float moonGlow = smoothstep(0.45, 0.0, moonDist) * 0.6;
    float moonCore = smoothstep(0.05, 0.0, moonDist);

    // 合成
    vec3 col = C_INK;
    col += topColor * top * topMask * 0.55 * uIntensity;
    col += botColor * bottom * botMask * 0.35 * uIntensity;
    col += mouseColor * mouseGlow * uIntensity;
    col += vec3(1.0) * stars * 0.8;
    col += vec3(1.0, 0.7, 0.9) * moonGlow * 0.4;
    col += vec3(1.0, 0.95, 1.0) * moonCore;

    // 顶部暗化（让导航可读）
    col *= mix(0.55, 1.0, smoothstep(0.0, 0.3, vUv.y));
    // 底部加深
    col *= mix(1.0, 0.4, smoothstep(0.5, 1.0, 1.0 - vUv.y));

    // 轻微色差（边缘）
    float aberration = smoothstep(0.4, 1.0, abs(p.x)) * 0.004;
    // 由于是单次着色，模拟色差仅作为色调偏移
    col.r *= 1.0 + aberration;
    col.b *= 1.0 - aberration;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function AuroraPlane({
  mouseInfluence = 0.4,
  intensity = 1.0,
}: AuroraPlaneProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uIntensity: { value: intensity },
      uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 鼠标平滑跟随
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));

  useFrame((state, delta) => {
    if (!matRef.current) return;
    const m = state.pointer;
    targetMouse.current.x = 0.5 + m.x * mouseInfluence;
    targetMouse.current.y = 0.5 + m.y * mouseInfluence;
    const cur = matRef.current.uniforms.uMouse.value as THREE.Vector2;
    cur.x += (targetMouse.current.x - cur.x) * 0.04;
    cur.y += (targetMouse.current.y - cur.y) * 0.04;
    matRef.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
