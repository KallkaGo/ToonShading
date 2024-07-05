import { Effect } from "postprocessing";
import { Uniform } from "three";
import { FC, useMemo } from "react";

interface IProps {
  exposure: number;
}

class ToneMapEffect extends Effect {
  constructor({ exposure = 1.0 }: IProps) {
    super(
      "ToneMap",
      /* glsl */ `
      uniform float uExposure;
      vec3 toneMap(vec3 color) {
        vec3 c0 = (1.36 * color + 0.047) * color;
        vec3 c1 = (.93 * color + 0.56) * color + 0.14;
        return clamp(c0/c1,0.,1.);
      }
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 col = toneMap(inputColor.rgb * uExposure);
        outputColor = vec4(col, 1.);
      }
      `,
      {
        uniforms: new Map([["uExposure", new Uniform(exposure)]]),
      }
    );
  }
}

const ToneMap: FC<IProps> = (prop) => {
  const effect = new ToneMapEffect(prop);
  return <primitive object={effect} dispose={null} />;
};

export { ToneMap };
