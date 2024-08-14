import {
  Environment,
  OrbitControls,
  Sky,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { useInteractStore, useLoadedStore } from "@utils/Store";
import { useEffect, useMemo, useRef } from "react";
import {
  BackSide,
  Color,
  Group,
  LinearSRGBColorSpace,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Uniform,
  Vector2,
  Vector3,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertexShader from "../shader/vertex.glsl";
import FacefragmentShader from "../shader/face/fragment.glsl";
import OtherfragmentShader from "../shader/body/fragment.glsl";
import outlineVertexShader from "../shader/outline/vertex.glsl";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import GTToneMap from "../effect/GTToneMap";
import { Bloom as CustomBloom } from "../effect/Bloom";
import { useDepthTexture } from "@utils/useDepthTexture";

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
      uRimLightWidth: new Uniform(1),
      uRimLightIntensity: new Uniform(1),
      uTime: new Uniform(0),
    }),
    []
  );

  const outlineUniforms = useMemo(
    () => ({
      uResolution: new Uniform(new Vector2()),
      uOutLineWidth: new Uniform(0.4),
    }),
    []
  );

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

  const { color, int } = useControls("Light", {
    color: {
      value: "#e5cebe",
    },
    int: {
      value: 0.49,
      min: 0,
      max: 2,
      step: 0.01,
    },
    rotation: {
      value: 5.31,
      min: 0,
      max: Math.PI * 2,
      step: Math.PI / 100,
      onChange: (v) => {
        groupRef.current!.rotation.y = v;
      },
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
      value: 1.7,
      min: 0,
      max: 10,
      step: 0.01,
    },
    radius: {
      value: 0,
      min: -10,
      max: 10,
      step: 0.01,
    },
    luminanceThreshold: {
      value: 0.75,
      min: 0,
      max: 1,
      step: 0.01,
    },
    luminanceSmoothing: {
      value: 0.05,
      min: 0,
      max: 1,
      step: 0.01,
    },
    iteration: {
      value: 3,
      min: 1,
      max: 10,
      step: 1,
    },
    glowColor: {
      value: "#d8b2b2",
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

  useControls("RimLight", {
    RimLightWidth: {
      value: 0.2,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        uniforms.uRimLightWidth.value = v;
      },
    },
    intensity: {
      value: 0.5,
      min: 0,
      max: 10,
      step: 0.01,
      onChange: (v) => {
        uniforms.uRimLightIntensity.value = v;
      },
    },
  });

  const gtProps = useControls("ToneMapGT", {
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
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
    },
    LinearSectionLength: {
      value: 0.12,
      min: 0,
      max: 0.99,
      step: 0.01,
    },
    BlackTightnessC: {
      value: 1.69,
      min: 1,
      max: 3,
      step: 0.01,
    },
    BlackTightnessB: {
      value: 0.0,
      min: 0,
      max: 1,
      step: 0.25,
    },
    Enabled: true,
  });

  // const { exposure } = useControls("ToneMap", {
  //   exposure: {
  //     value: 1,
  //     min: 0,
  //     max: 10,
  //     step: 0.01,
  //   },
  // });

  const { depthTexture } = useDepthTexture(innerWidth, innerHeight);

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
        child.material.uniforms.uDepthTexture = new Uniform(depthTexture);
      }
    });
    console.log("ayakaGltf.scene", ayakaGltf.scene);
    backModel.traverse((child) => {
      if (child instanceof Mesh) {
        const mat = new CustomShaderMaterial({
          baseMaterial: MeshStandardMaterial,
          uniforms: outlineUniforms,
          vertexShader: outlineVertexShader,
          fragmentShader: `
          varying vec2 vUv;
          uniform vec3 uOutLineColor;
          uniform sampler2D uDiffuse;
          void main(){
            vec4 baseColor = csm_DiffuseColor;
            if(baseColor.a < 0.5) discard;
            csm_FragColor = vec4(baseColor.rgb * .15, 1.);
          }
          `,
          side: BackSide,
          vertexColors: true,
          silent: true,
          map: child.material.map,
        });
        child.material = mat;
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
      <ambientLight intensity={int} color={color} />

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
        <mesh position={[0, 10, 10]} scale={[0.2, 0.2, 0.2]}>
          <sphereGeometry></sphereGeometry>
          <meshBasicMaterial color={"hotpink"}></meshBasicMaterial>
        </mesh>
      </group>
      <EffectComposer disableNormalPass enabled={true}  >
        <CustomBloom
          intensity={intensity}
          luminanceThreshold={luminanceThreshold}
          luminanceSmoothing={luminanceSmoothing}
          radius={radius}
          iteration={iteration}
          glowColor={glowColor}
        />
        <GTToneMap {...gtProps} />
        <SMAA />
      </EffectComposer>
    </>
  );
};

export default Sketch;
