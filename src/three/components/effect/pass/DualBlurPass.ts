import { Pass, ShaderPass } from "postprocessing";
import { HalfFloatType, ShaderMaterial, Texture, Uniform, UnsignedByteType, Vector2, WebGLRenderTarget, WebGLRenderer } from "three";
import downVertex from "../shader/downVertex.glsl";
import downFragment from "../shader/downFragment.glsl";
import upVertex from "../shader/upVertex.glsl";
import upFragment from "../shader/upFragment.glsl";

interface IProps {
  loopCount?: number;
  blurRange?: number;
}


let downRt: WebGLRenderTarget[] = [];
let upRt: WebGLRenderTarget[] = [];

class DualBlurPass extends Pass {
  private downSampleMaterial!: ShaderMaterial;
  private upSampleMaterial!: ShaderMaterial;

  private downSamplePass!: ShaderPass;

  private upSamplePass!: ShaderPass;

  public loopCount: number = 0;

  public finRT!: WebGLRenderTarget;

  constructor({ loopCount = 4, blurRange = 0 }: IProps) {
    super('DualBlurPass');

    this.dispose();

    this.loopCount = loopCount;

    this.downSampleMaterial = new ShaderMaterial({
      vertexShader: downVertex,
      fragmentShader: downFragment,
      uniforms: {
        inputBuffer: new Uniform(null),
        uSize: new Uniform(new Vector2(1 / innerWidth, 1 / innerHeight)),
        u_blurRange: new Uniform(blurRange),
      },
    });
    this.upSampleMaterial = new ShaderMaterial({
      vertexShader: upVertex,
      fragmentShader: upFragment,
      uniforms: {
        inputBuffer: new Uniform(null),
        uSize: new Uniform(new Vector2(1 / innerWidth, 1 / innerHeight)),
        u_blurRange: new Uniform(blurRange),
      },
    });

    this.downSamplePass = new ShaderPass(this.downSampleMaterial);
    this.upSamplePass = new ShaderPass(this.upSampleMaterial);

    this.finRT = new WebGLRenderTarget(innerWidth, innerHeight, {
      samples: 4,
    });

    // initial
    for (let i = 0; i < this.loopCount; i++) {
      const rtDown = new WebGLRenderTarget(1, 1, {
        type: UnsignedByteType,
      });
      const rtUp = new WebGLRenderTarget(1, 1, {
        type: UnsignedByteType,
      });
      downRt[i] = rtDown;
      upRt[i] = rtUp;
    }
  }

  render(renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget,
  ) {
    const count = this.loopCount;
    let width = inputBuffer.width;
    let height = inputBuffer.height;

    // down sample
    for (let i = 0; i < count; i++) {
      downRt[i].setSize(width, height);
      upRt[i].setSize(width, height);
      this.downSampleMaterial.uniforms["uSize"].value.set(
        1 / width,
        1 / height
      );
      this.upSampleMaterial.uniforms["uSize"].value.set(1 / width, 1 / height);
      width = Math.max(width / 2, 1);
      height = Math.max(height / 2, 1);
      if (i === 0) {
        this.finRT.texture = inputBuffer.texture;
      }
      this.downSamplePass.render(renderer, this.finRT, downRt[i]);
      this.finRT.texture = downRt[i].texture;
    }
    // up sample
    for (let i = count - 1; i >= 0; i--) {
      this.upSamplePass.render(renderer, this.finRT, upRt[i]);
      this.finRT.texture = upRt[i].texture;
    }

  }

  set blurRange(value: number) {
    this.downSampleMaterial.uniforms["u_blurRange"].value = value;
    this.upSampleMaterial.uniforms["u_blurRange"].value = value;
  }

  dispose() {
    downRt.forEach(rt => rt.dispose())
    upRt.forEach(rt => rt.dispose())
  }
}

export { DualBlurPass }