/**
 * FloatingShards — 浮动碎片
 *
 * 使用 InstancedMesh 渲染多个低多边形水晶碎片
 * - 缓慢自旋 + 上下漂浮
 * - 鼠标视差整体偏移
 * - 边缘发光（Fresnel 着色器）
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface FloatingShardsProps {
  count?: number;
}

const FRESNEL_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRESNEL_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;

  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.5);
    vec3 col = mix(uColorA, uColorB, fresnel);
    col += fresnel * 0.5;
    // 轻微内部脉动
    col *= 0.7 + 0.3 * sin(uTime * 1.5);
    gl_FragColor = vec4(col, fresnel * 0.85 + 0.15);
  }
`;

const COLORS = [
  ["#7C3AED", "#00E5FF"],
  ["#FF2D95", "#7C3AED"],
  ["#00FFB2", "#00E5FF"],
  ["#00E5FF", "#FF2D95"],
];

export default function FloatingShards({ count = 12 }: FloatingShardsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  const instances = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8 - 2,
      ),
      rotation: new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ),
      scale: Math.random() * 0.4 + 0.15,
      speed: Math.random() * 0.4 + 0.2,
      offset: Math.random() * Math.PI * 2,
      colorIdx: Math.floor(Math.random() * COLORS.length),
    }));
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const uniforms = useMemo(
    () => ({
      uColorA: { value: new THREE.Color("#7C3AED") },
      uColorB: { value: new THREE.Color("#00E5FF") },
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (!meshRef.current || !matRef.current || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    instances.forEach((inst, i) => {
      dummy.position.copy(inst.position);
      dummy.position.y += Math.sin(t * inst.speed + inst.offset) * 0.4;
      dummy.position.x += Math.cos(t * inst.speed * 0.7 + inst.offset) * 0.2;
      dummy.rotation.x = inst.rotation.x + t * inst.speed * 0.3;
      dummy.rotation.y = inst.rotation.y + t * inst.speed * 0.2;
      dummy.rotation.z = inst.rotation.z + t * inst.speed * 0.15;
      dummy.scale.setScalar(inst.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;

    // 整组鼠标视差
    const mx = state.pointer.x;
    const my = state.pointer.y;
    groupRef.current.position.x += (mx * 0.8 - groupRef.current.position.x) * 0.04;
    groupRef.current.position.y += (my * 0.5 - groupRef.current.position.y) * 0.04;

    matRef.current.uniforms.uTime.value += delta;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={FRESNEL_VERT}
          fragmentShader={FRESNEL_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}
