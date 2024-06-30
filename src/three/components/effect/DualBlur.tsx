import { Effect } from "postprocessing";
import { Texture, Uniform, WebGLRenderTarget, WebGLRenderer } from "three";
import { FC, useEffect, useMemo, useRef } from "react";
import { useFBO } from "@react-three/drei";
import { DualBlurPass } from "./pass/DualBlurPass";

interface IProps {
  loopCount: number;
  blurRange?: number;
}

const fragmentShader = /* glsl */ `
uniform sampler2D map;
 void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor)
    { 
        vec4 color = texture2D(map, uv);
        outputColor = color;
    }
`;

// class DualBlurEffect extends Effect {
//   private downSampleMaterial!: ShaderMaterial;
//   private upSampleMaterial!: ShaderMaterial;

//   private downSamplePass!: ShaderPass;

//   private upSamplePass!: ShaderPass;

//   public downSampleRT: Array<WebGLRenderTarget> = [];

//   public upSampleRT: Array<WebGLRenderTarget> = [];

//   public loopCount: number = 0;

//   public finRT!: WebGLRenderTarget;

//   constructor(
//     props: IProps = {
//       loopCount: 4,
//       blurRange: 0,
//     },
//     downRt: WebGLRenderTarget[],
//     upRt: WebGLRenderTarget[]
//   ) {
//     super("DualBlurEffect", fragmentShader, {
//       uniforms: new Map([["map", new Uniform(null)]]),
//     });
//     this.downSampleMaterial = new ShaderMaterial({
//       vertexShader: downVertex,
//       fragmentShader: downFragment,
//       uniforms: {
//         inputBuffer: new Uniform(null),
//         uSize: new Uniform(new Vector2(1 / innerWidth, 1 / innerHeight)),
//         u_blurRange: new Uniform(0),
//       },
//     });
//     this.upSampleMaterial = new ShaderMaterial({
//       vertexShader: upVertex,
//       fragmentShader: upFragment,
//       uniforms: {
//         inputBuffer: new Uniform(null),
//         uSize: new Uniform(new Vector2(1 / innerWidth, 1 / innerHeight)),
//         u_blurRange: new Uniform(0),
//       },
//     });

//     this.loopCount = props.loopCount;

//     this.downSamplePass = new ShaderPass(this.downSampleMaterial);
//     this.upSamplePass = new ShaderPass(this.upSampleMaterial);

//     this.finRT = new WebGLRenderTarget();

//     // initial
//     for (let i = 0; i < props.loopCount; i++) {
//       const rtDown = new WebGLRenderTarget(1, 1, {
//         type: UnsignedByteType,
//       });
//       const rtUp = new WebGLRenderTarget(1, 1, {
//         type: UnsignedByteType,
//       });
//       downRt[i] = rtDown;
//       upRt[i] = rtUp;
//     }
//     this.downSampleRT = downRt;
//     this.upSampleRT = upRt;
//   }

//   update(
//     renderer: WebGLRenderer,
//     inputBuffer: WebGLRenderTarget<Texture>,
//     deltaTime?: number | undefined
//   ) {
//     const count = this.loopCount;
//     let width = inputBuffer.width;
//     let height = inputBuffer.height;

//     for (let i = 0; i < count; i++) {
//       this.downSampleRT[i].dispose();
//       this.upSampleRT[i].dispose();
//     }

//     // down sample
//     for (let i = 0; i < count; i++) {
//       this.downSampleRT[i].setSize(width, height);
//       this.upSampleRT[i].setSize(width, height);
//       this.downSampleMaterial.uniforms["uSize"].value.set(
//         1 / width,
//         1 / height
//       );
//       this.upSampleMaterial.uniforms["uSize"].value.set(1 / width, 1 / height);
//       width = Math.max(width / 2, 1);
//       height = Math.max(height / 2, 1);
//       if (i === 0) {
//         this.finRT.texture = inputBuffer.texture;
//       }
//       this.downSamplePass.render(renderer, this.finRT, this.downSampleRT[i]);
//       this.finRT.texture = this.downSampleRT[i].texture;
//     }
//     // up sample
//     for (let i = count - 1; i >= 0; i--) {
//       this.upSamplePass.render(renderer, this.finRT, this.upSampleRT[i]);
//       this.finRT.texture = this.upSampleRT[i].texture;
//     }
//     this.uniforms.get("map")!.value = this.finRT.texture;
//   }
// }

class DualBlurEffect extends Effect {
  private dualBlurPass: DualBlurPass;
  constructor(
    props: IProps = {
      loopCount: 4,
      blurRange: 0,
    }
  ) {
    super("DualBlurEffect", fragmentShader, {
      uniforms: new Map([["map", new Uniform(null)]]),
    });
    this.dualBlurPass = new DualBlurPass(props);
  }

  update(
    renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget<Texture>,
    deltaTime?: number | undefined
  ) {
    this.dualBlurPass.render(renderer, inputBuffer);
    this.uniforms.get("map")!.value = this.dualBlurPass.finRT.texture;
  }
}

const DualBlur: FC<IProps> = (props) => {
  const effect = useMemo(() => {
    return new DualBlurEffect(props);
  }, [props]);

  return <primitive object={effect} dispose={null} />;
};

export { DualBlur, DualBlurEffect };
