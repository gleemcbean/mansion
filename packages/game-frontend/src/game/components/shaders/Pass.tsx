import { useMemo, forwardRef } from "react";
import { Uniform } from "three";
import fragment from "./main.glsl";
import { Effect as PPEffect } from "postprocessing";
import { useFrame } from "@react-three/fiber";

class Effect extends PPEffect {
  constructor() {
    super("ShaderPass", fragment, {
      uniforms: new Map<string, Uniform>([
        ["uTime", new Uniform(0)],
        ["uResolution", new Uniform([0, 0])],
      ]),
    });
  }
}

export default forwardRef((props, ref) => {
  const effect = useMemo(() => new Effect(), []);

  useFrame((state) => {
    effect.uniforms.get("uTime")!.value = state.clock.elapsedTime;
    effect.uniforms.get("uResolution")!.value = [
      state.viewport.width,
      state.viewport.height,
    ];
  });

  return <primitive ref={ref} object={effect} {...props} />;
});
