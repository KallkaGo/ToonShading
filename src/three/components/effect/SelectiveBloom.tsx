import { useThree } from "@react-three/fiber";
import { BlendFunction, SelectiveBloomEffect } from "postprocessing";
import { forwardRef, useEffect, useMemo } from "react";

interface IProps {
  mipmapBlur?: boolean;
  blendFunction?: any;
  luminanceThreshold?: number;
  luminanceSmoothing?: number;
  intensity?: number;
}

export default forwardRef(function SelectiveBloom(
  props: IProps = {
    mipmapBlur: true,
    blendFunction: BlendFunction.ADD,
    luminanceThreshold: 0,
    luminanceSmoothing: 0.25,
    intensity: 1.0,
  },
  ref
) {
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const effect = useMemo(() => {
    return new SelectiveBloomEffect(scene, camera, props);
  }, [scene, camera]);

  useEffect(() => {
    effect.luminanceMaterial.threshold = Number(props.luminanceThreshold);
    effect.luminanceMaterial.smoothing = Number(props.luminanceSmoothing);
    effect.intensity = Number(props.intensity);
  }, [JSON.stringify(props)]);

  return <primitive object={effect} dispose={null} ref={ref} />;
});
