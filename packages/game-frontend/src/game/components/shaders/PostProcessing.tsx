import usePlayer from "@/hooks/useClient";
import {
  ChromaticAberration,
  EffectComposer,
} from "@react-three/postprocessing";
import Pass from "./Pass";
import type { JSX } from "react";

export default function PostProcessing() {
  const { options } = usePlayer();

  return (
    options.doPostProcessing && (
      <EffectComposer>
        <Pass />
        {
          (options.chromaticAberration && (
            <ChromaticAberration
              offset={[0.0075, 0.005]}
              radialModulation
              modulationOffset={0.5}
            />
          )) as JSX.Element
        }
      </EffectComposer>
    )
  );
}
