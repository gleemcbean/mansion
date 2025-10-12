import { useMemo, forwardRef } from "react";
import { Uniform } from "three";
import fragment from "./main.glsl";
import { Effect as PPEffect } from "postprocessing";
import { useFrame } from "@react-three/fiber";

class Effect extends PPEffect {
  constructor() {
    super("ShaderPass", fragment, {
      uniforms: new Map([["uTime", new Uniform(0)]]),
    });
  }
}

export default forwardRef((props, ref) => {
  const effect = useMemo(() => new Effect(), []);

  useFrame((state) => {
    effect.uniforms.get("uTime")!.value = state.clock.elapsedTime;
  });

  return <primitive ref={ref} object={effect} {...props} />;
});
