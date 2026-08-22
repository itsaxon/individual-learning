/**
 * PostFX — 后期处理
 * Bloom + Chromatic Aberration + Noise + Vignette
 * 根据 PerfConfig 启用对应效果
 */
import {
  Bloom,
  ChromaticAberration,
  Noise,
  Vignette,
  EffectComposer,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import type { PerfConfig } from "@/hooks/usePerformanceTier";

interface PostFXProps {
  config: PerfConfig;
}

export default function PostFX({ config }: PostFXProps) {
  if (!config.bloom && !config.chromaticAberration && !config.noise && !config.vignette) {
    return null;
  }

  return (
    <EffectComposer multisampling={0}>
      {config.bloom && (
        <Bloom
          intensity={config.bloomIntensity}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.8}
        />
      )}
      {config.chromaticAberration && (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0006, 0.0009)}
          radialModulation={false}
          modulationOffset={0}
        />
      )}
      {config.noise && (
        <Noise
          premultiply
          blendFunction={BlendFunction.ADD}
          opacity={0.04}
        />
      )}
      {config.vignette && (
        <Vignette eskil={false} offset={0.3} darkness={0.85} />
      )}
    </EffectComposer>
  );
}
