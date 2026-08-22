/**
 * useCountUp — 数字滚动动画（Framer Motion）
 */
import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

export function useCountUp(target: number, duration = 1500) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 60,
    damping: 18,
    duration,
  });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) {
      motionValue.set(target);
    }
  }, [inView, target, motionValue]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      setDisplay(v);
    });
    return () => unsub();
  }, [spring]);

  return { ref, display };
}
