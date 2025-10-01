import usePlayer from "@/hooks/useClient";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Scanline,
  Vignette,
} from "@react-three/postprocessing";
import { type JSX } from "react";

export default function PostProcessing() {
  const { options } = usePlayer();

  return (
    options.doPostProcessing && (
      <EffectComposer>
        {(options.noise && <Noise opacity={0.08} />) as JSX.Element}
        {
          (options.bloom && (
            <Bloom
              intensity={0.4}
              luminanceThreshold={0.6}
              luminanceSmoothing={0.4}
              mipmapBlur
            />
          )) as JSX.Element
        }
        <Scanline density={2} opacity={0.05} />
        {
          (options.chromaticAberration && (
            <ChromaticAberration
              offset={[0.0075, 0.005]}
              radialModulation
              modulationOffset={0.5}
            />
          )) as JSX.Element
        }
        <Vignette eskil={false} offset={0.1} darkness={1} />
      </EffectComposer>
    )
  );
}
