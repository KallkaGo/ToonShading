import {
  Environment,
  OrbitControls,
  Sky,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { useInteractStore, useLoadedStore } from "@utils/Store";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BackSide,
  Color,
  FrontSide,
  Group,
  HalfFloatType,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  ShaderMaterial,
  Uniform,
  UnsignedByteType,
  Vector2,
  Vector3,
  Texture,
  DoubleSide,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertexShader from "../shader/vertex.glsl";
import FacefragmentShader from "../shader/face/fragment.glsl";
import OtherfragmentShader from "../shader/body/fragment.glsl";
import outlineVertexShader from "../shader/outline/vertex.glsl";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import {
  EffectComposer,
  ToneMapping,
  Bloom,
} from "@react-three/postprocessing";
import GTToneMap from "../effect/GTToneMap";
import { Bloom as CustomBloom } from "../effect/Bloom";

const Sketch = () => {
  const ayakaGltf = useGLTF("/ayaka.glb");
  const faceLightMap = useTexture("/Face/faceLightmap.png");
  faceLightMap.wrapS = faceLightMap.wrapT = RepeatWrapping;
  faceLightMap.generateMipmaps = false;
  faceLightMap.flipY = false;
  const hairLightMap = useTexture("/Hair/light.png");
  hairLightMap.flipY = false;
  hairLightMap.wrapS = hairLightMap.wrapT = RepeatWrapping;
  const bodyLightMap = useTexture("/Body/light.png");
  bodyLightMap.flipY = false;
  bodyLightMap.wrapS = bodyLightMap.wrapT = RepeatWrapping;
  const hairRampMap = useTexture("/Hair/ramp.png");
  hairRampMap.generateMipmaps = false;
  hairRampMap.colorSpace = LinearSRGBColorSpace;

  const bodyEmissiveMap = useTexture("/Body/emissive.png");
  bodyEmissiveMap.flipY = false;
  bodyEmissiveMap.colorSpace = SRGBColorSpace;

  const bodyRampMap = useTexture("/Body/ramp.png");
  bodyRampMap.generateMipmaps = false;

  const metalMap = useTexture("matcap/metalMap.png");

  const hairNormalMap = useTexture("/Hair/normal.png");
  hairNormalMap.wrapS = hairNormalMap.wrapT = RepeatWrapping;
  hairNormalMap.flipY = false;

  const bodyNormalMap = useTexture("/Body/normal.png");
  bodyNormalMap.wrapS = bodyNormalMap.wrapT = RepeatWrapping;
  bodyNormalMap.flipY = false;

  const ayakaRef = useRef<any>(null);
  const groupRef = useRef<Group>(null);
  const bloomRef = useRef<any>(null);
  const controlDom = useInteractStore((state) => state.controlDom);
  const scene = useThree((state) => state.scene);

  const uniforms = useMemo(
    () => ({
      uLightPosition: new Uniform(new Vector3()),
      uFaceLightMap: new Uniform(faceLightMap),
      uRampVmove: new Uniform(0.5), //白天
      uIsDay: new Uniform(0.5),
      uHair: new Uniform(false),
      uShadowColor: new Uniform(new Color("white")),
      uMetalMap: new Uniform(metalMap),
      uNoMetallic: new Uniform(1),
      uMetallic: new Uniform(0.5),
      uTime: new Uniform(0),
    }),
    []
  );

  const outlineUniforms = useMemo(
    () => ({
      uResolution: new Uniform(new Vector2()),
      uOutLineWidth: new Uniform(0.45),
    }),
    []
  );

  useControls("Light", {
    rotation: {
      value: 0,
      min: 0,
      max: Math.PI * 2,
      step: Math.PI / 100,
      onChange: (v) => {
        groupRef.current!.rotation.y = v;
      },
    },
  });

  useControls("Time", {
    time: {
      value: 1,
      min: -1,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        uniforms.uIsDay.value = v;
      },
    },
  });

  // const { intensity, threshold, luminanceSmoothing } = useControls("bloom", {
  //   intensity: {
  //     value: 1.41,
  //     min: 0,
  //     max: 10,
  //     step: 0.01,
  //   },
  //   radius: {
  //     value: 0.15,
  //     min: 0,
  //     max: 1,
  //     step: 0.01,
  //   },
  //   threshold: { value: 0.8, min: 0, max: 1, step: 0.01 },
  //   luminanceSmoothing: { value: 0.56, min: 0, max: 1, step: 0.01 },
  //   ignoreBackground: {
  //     value: true,
  //     onChange: (v) => {
  //       // bloomRef.current.ignoreBackground = v;
  //     },
  //   },
  //   filter: {
  //     value: true,
  //     onChange: (v) => {
  //       // bloomRef.current.luminancePass.enabled = v;
  //     },
  //   },
  //   inverted: {
  //     value: true,
  //     onChange: (v) => {
  //       // bloomRef.current.inverted = v;
  //     },
  //   },
  // });
  const { color, int } = useControls("Light", {
    color: {
      value: "#b15f5f",
    },
    int: {
      value: 0.7,
      min: 0,
      max: 2,
      step: 0.01,
    },
  });

  const {
    intensity,
    radius,
    luminanceThreshold,
    iteration,
    luminanceSmoothing,
    glowColor,
  } = useControls("Bloom", {
    intensity: {
      value: 2,
      min: 0,
      max: 10,
      step: 0.01,
    },
    radius: {
      value: 0.97,
      min: 0,
      max: 10,
      step: 0.01,
    },
    luminanceThreshold: {
      value: 0.9,
      min: 0,
      max: 1,
      step: 0.01,
    },
    luminanceSmoothing: {
      value: 0.56,
      min: 0,
      max: 1,
      step: 0.01,
    },
    iteration: {
      value: 4,
      min: 1,
      max: 10,
      step: 1,
    },
    glowColor: {
      value: "#fff0e5",
    },
  });

  useControls("Shadow", {
    ShadowColor: {
      value: "white",
      onChange: (v) => {
        uniforms.uShadowColor.value = new Color(v);
      },
    },
  });

  useControls("Metal", {
    metallic: {
      value: 0.2,
      min: 0,
      max: 10,
      step: 0.01,
      onChange: (v) => {
        uniforms.uMetallic.value = v;
      },
    },
    noMetallic: {
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        uniforms.uNoMetallic.value = v;
      },
    },
  });

  const gtProps = useControls("ToneMap", {
    MaxLuminanice: {
      value: 2,
      min: 1,
      max: 100,
      step: 0.01,
    },
    Contrast: {
      value: 1,
      min: 1,
      max: 5,
      step: 0.01,
    },
    LinearSectionStart: {
      value: 0.38,
      min: 0,
      max: 1,
      step: 0.01,
    },
    LinearSectionLength: {
      value: 0.82,
      min: 0,
      max: 0.99,
      step: 0.01,
    },
    BlackTightnessC: {
      value: 1.33,
      min: 1,
      max: 3,
      step: 0.01,
    },
    BlackTightnessB: {
      value: 0.0,
      min: 0,
      max: 1,
      step: 0.01,
    },
    Enabled: true,
  });

  useEffect(() => {
    const backModel = ayakaGltf.scene.clone(true);
    ayakaGltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        const mat = child.material as MeshStandardMaterial;
        mat.map!.colorSpace = SRGBColorSpace;
        if (mat.name == "face") {
          const newMat = new CustomShaderMaterial({
            baseMaterial: MeshStandardMaterial,
            vertexShader,
            fragmentShader: FacefragmentShader,
            uniforms,
            map: mat.map,
            silent: true,
            transparent: mat.transparent,
            side: mat.side,
            alphaTest: mat.alphaTest,
          });
          child.material = newMat;
          child.material.uniforms.uRampMap = new Uniform(bodyRampMap);
          child.material.uniforms.uForwardVec = new Uniform(
            new Vector3(0, 0, 1)
          );
          child.material.uniforms.uLeftVec = new Uniform(new Vector3(1, 0, 0));
        } else {
          child.material = new CustomShaderMaterial({
            name: mat.name,
            baseMaterial: MeshStandardMaterial,
            color: mat.color,
            transparent: mat.transparent,
            map: mat.map,
            depthWrite: mat.depthWrite,
            depthTest: mat.depthTest,
            side: mat.side,
            silent: true,
            alphaTest: mat.alphaTest,
            uniforms,
            vertexShader,
            fragmentShader: OtherfragmentShader,
          });
          if (mat.name === "hair" || mat.name == "dress") {
            child.material.uniforms.uLightMap = new Uniform(hairLightMap);
            child.material.uniforms.uRampMap = new Uniform(hairRampMap);
            child.material.uniforms.uNormalMap = new Uniform(hairNormalMap);
            child.material.uniforms.uEmissiveMap = new Uniform(null);
          } else if (mat.name == "body") {
            child.material.uniforms.uLightMap = new Uniform(bodyLightMap);
            child.material.uniforms.uRampMap = new Uniform(bodyRampMap);
            child.material.uniforms.uNormalMap = new Uniform(bodyNormalMap);
            child.material.uniforms.uEmissiveMap = new Uniform(bodyEmissiveMap);
          }
        }
      }
    });
    console.log("ayakaGltf.scene", ayakaGltf.scene);
    backModel.traverse((child) => {
      if (child instanceof Mesh) {
        console.log(child.material.name);
        if (child.material.name === "face") {
          const mat = new ShaderMaterial({
            uniforms: outlineUniforms,
            vertexShader: outlineVertexShader,
            fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            void main(){
              gl_FragColor = vec4(uColor, 1.);
            }
            `,
            side: BackSide,
          });
          mat.uniforms.uColor = new Uniform(new Color("#d97d73"));
          child.material = mat;
        } else {
          const mat = new ShaderMaterial({
            uniforms: outlineUniforms,
            vertexShader: outlineVertexShader,
            fragmentShader: /* glsl */ `
            varying vec2 vUv;
            uniform vec3 uOutLineColor;
            uniform sampler2D uDiffuse;
            void main(){
              vec4 col = texture2D(uDiffuse, vUv);
              if(col.a < 0.5) discard;
              gl_FragColor = vec4(uOutLineColor, 1.);
            }
            `,
            side: BackSide,
          });
          mat.uniforms.uOutLineColor = new Uniform(new Color("black"));
          mat.uniforms.uDiffuse = new Uniform(child.material.map);
          child.material = mat;
        }
      }
    });
    backModel.position.set(0, -0.7, 0);
    scene.add(backModel);
    useLoadedStore.setState({ ready: true });
  }, []);

  useFrame((state, delta) => {
    delta %= 1;
    const vec = new Vector3();
    groupRef.current?.children[0].getWorldPosition(vec);
    uniforms.uLightPosition.value = vec;
    uniforms.uTime.value += delta;
    outlineUniforms.uResolution.value.set(innerWidth, innerHeight);
  });

  return (
    <>
      <OrbitControls domElement={controlDom} />
      <color attach={"background"} args={["ivory"]} />
      {/* <primitive object={gltf.scene} scale={[2, 2, 2]} /> */}
      {/* <Environment preset={"city"} /> */}
      <ambientLight intensity={int} color={color} />
      <ambientLight intensity={0.25} color={"red"} />

      <Sky
        sunPosition={[0, 0, -1]}
        distance={50000}
        turbidity={8}
        rayleigh={6}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <primitive
        object={ayakaGltf.scene}
        ref={ayakaRef}
        position={[0, -0.7, 0]}
      />

      <group ref={groupRef} visible={false}>
        <mesh position={[0, 0, 1]} scale={[0.2, 0.2, 0.2]}>
          <sphereGeometry></sphereGeometry>
          <meshBasicMaterial color={"hotpink"}></meshBasicMaterial>
        </mesh>
      </group>
      <EffectComposer disableNormalPass frameBufferType={HalfFloatType}>
        {/* <Bloom
          luminanceThreshold={luminanceThreshold}
          luminanceSmoothing={luminanceSmoothing}
          intensity={intensity}
          mipmapBlur
          radius={0.3}
    
        /> */}
        {/* <SelectiveBloom
          ref={bloomRef}
          luminanceThreshold={threshold}
          luminanceSmoothing={luminanceSmoothing}
          intensity={intensity}
        /> */}
        <CustomBloom
          intensity={intensity}
          luminanceThreshold={luminanceThreshold}
          luminanceSmoothing={luminanceSmoothing}
          radius={radius}
          iteration={iteration}
          glowColor={glowColor}
        />
        <GTToneMap {...gtProps} />
      </EffectComposer>
    </>
  );
};

export default Sketch;
