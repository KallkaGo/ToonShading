import { Effect, ShaderPass } from "postprocessing";
import {
  Color,
  HalfFloatType,
  ShaderMaterial,
  Texture,
  Uniform,
  UnsignedByteType,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";
import { DualBlurPass } from "./pass/DualBlurPass";
import { FC, forwardRef, useMemo } from "react";

interface IProps {
  luminanceThreshold?: number;
  luminanceSmoothing?: number;
  radius?: number;
  intensity?: number;
  iteration?: number;
  glowColor?: string;
}

const fragmentShader = /* glsl */ `
uniform sampler2D blurMap;
uniform float intensity;
uniform vec3 glowColor;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor)
{ 
    vec4 color = texture2D(blurMap, uv);
    outputColor =  inputColor+color * intensity *vec4(glowColor,1.0);
}
`;

let tempRt: WebGLRenderTarget;

class BloomEffect extends Effect {
  private luminancePass!: ShaderPass;
  private luminanceMaterial!: ShaderMaterial;
  private dulaBlurPass!: DualBlurPass;

  constructor({
    luminanceThreshold = 0.1,
    radius = 1,
    intensity = 1,
    luminanceSmoothing = 0.1,
    glowColor = "white",
    iteration = 4,
  }: IProps) {
    super("Bloom", fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ["blurMap", new Uniform(null)],
        ["intensity", new Uniform(intensity)],
        ["glowColor", new Uniform(new Color(glowColor))],
      ]),
    });
    tempRt?.dispose();
    tempRt = new WebGLRenderTarget(innerWidth, innerHeight, {
      samples: 4,
    });

    this.luminanceMaterial = new ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D inputBuffer;
        uniform float luminanceThreshold;
        uniform float luminanceSmoothing;
        varying vec2 vUv;

        float luminance(vec3 color) {
          return 0.2125 * color.r + 0.7154 * color.g + 0.0721 * color.b; 
        }

        void main() {
          vec4 color = texture2D(inputBuffer, vUv);
          float luma = luminance(color.rgb);
          luma = smoothstep(luminanceThreshold, clamp(luminanceThreshold + luminanceSmoothing,0.,1.), luma);
          // float v = step(luminanceThreshold, luminance(color.rgb));
          // float v = clamp(luminance(color.rgb) - luminanceThreshold, 0.0, 1.0);
          gl_FragColor = vec4(color.rgb * luma, color.a);
        }
      `,
      uniforms: {
        inputBuffer: new Uniform(null),
        luminanceThreshold: new Uniform(luminanceThreshold),
        luminanceSmoothing: new Uniform(luminanceSmoothing),
      },
    });
    this.luminancePass = new ShaderPass(this.luminanceMaterial);

    this.dulaBlurPass = new DualBlurPass({
      loopCount: iteration,
      blurRange: radius,
    });
  }
  update(
    renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget<Texture>,
    deltaTime?: number | undefined
  ) {
    tempRt.setSize(inputBuffer.width, inputBuffer.height);
    this.luminancePass.render(renderer, inputBuffer, tempRt);
    this.dulaBlurPass.render(renderer, tempRt);
    this.uniforms.get("blurMap")!.value = this.dulaBlurPass.finRT.texture;
  }
}

const Bloom: FC<IProps> = forwardRef((props, ref) => {
  const effect = useMemo(() => new BloomEffect(props), [JSON.stringify(props)]);
  return <primitive object={effect} dispose={null} ref={ref} />;
});

export { Bloom };
