/**
 * ScrollCamera — 滚动驱动的相机
 * - 相机 Z 随滚动缓慢推进（电影镜头感）
 * - 相机轻微随鼠标偏移（视差）
 */
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function ScrollCamera() {
  const { camera } = useThree();
  const targetZ = useRef(0);
  const targetX = useRef(0);
  const targetY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(
        document.body.scrollHeight - window.innerHeight,
        1,
      );
      targetZ.current = (window.scrollY / max) * 4;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame((state) => {
    // 鼠标视差
    targetX.current = state.pointer.x * 0.6;
    targetY.current = state.pointer.y * 0.4;

    camera.position.x += (targetX.current - camera.position.x) * 0.04;
    camera.position.y += (targetY.current - camera.position.y) * 0.04;
    camera.position.z += (8 - targetZ.current - camera.position.z) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return null;
}
