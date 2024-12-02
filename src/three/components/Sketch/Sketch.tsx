import { OrbitControls, Sky, useTexture } from "@react-three/drei";
import { useInteractStore, useLoadedStore } from "@utils/Store";
import { useEffect, useMemo, useRef } from "react";
import {
  BackSide,
  Color,
  FrontSide,
  Group,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
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
import outlineFragmentShader from "../shader/outline/fragment.glsl";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import GTToneMap from "../effect/GTToneMap";
import { Bloom as CustomBloom } from "../effect/Bloom";
import { useDepthTexture } from "@utils/useDepthTexture";
import useKTX2Loader from "@utils/useKTX2Loader";
import RES from "./RES";
import { SMAAPreset } from "postprocessing";

const Sketch = () => {
  const ayakaGltf = useKTX2Loader(RES.model.ayaka);
  const faceLightMap = useTexture(RES.texture.faceLightMap);
  faceLightMap.generateMipmaps = false;
  faceLightMap.flipY = false;
  const hairLightMap = useTexture(RES.texture.hairLightMap);
  hairLightMap.flipY = false;
  hairLightMap.wrapS = hairLightMap.wrapT = RepeatWrapping;
  const bodyLightMap = useTexture(RES.texture.bodyLightMap);
  bodyLightMap.flipY = false;
  bodyLightMap.wrapS = bodyLightMap.wrapT = RepeatWrapping;
  const hairRampMap = useTexture(RES.texture.hairRampMap);
  hairRampMap.generateMipmaps = false;
  hairRampMap.colorSpace = SRGBColorSpace;

  const bodyEmissiveMap = useTexture(RES.texture.emissiveMap);
  bodyEmissiveMap.flipY = false;
  bodyEmissiveMap.colorSpace = SRGBColorSpace;

  const bodyRampMap = useTexture(RES.texture.bodyRampMap);
  bodyRampMap.colorSpace = SRGBColorSpace;
  bodyRampMap.generateMipmaps = false;

  const metalMap = useTexture(RES.texture.matcapMap);

  const hairNormalMap = useTexture(RES.texture.hairNormalMap);
  hairNormalMap.wrapS = hairNormalMap.wrapT = RepeatWrapping;
  hairNormalMap.flipY = false;

  const bodyNormalMap = useTexture(RES.texture.bodyNormalMap);
  bodyNormalMap.wrapS = bodyNormalMap.wrapT = RepeatWrapping;
  bodyNormalMap.flipY = false;

  const ayakaRef = useRef<Group>(null);
  const groupRef = useRef<Group>(null);
  const LightPosRef = useRef<Vector3>(new Vector3());
  const controlDom = useInteractStore((state) => state.controlDom);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);

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
      uNear: new Uniform(camera.near),
      uFar: new Uniform(camera.far),
      uResolution: new Uniform(
        new Vector2(
          innerWidth * devicePixelRatio,
          innerHeight * devicePixelRatio
        )
      ),
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

  /* Background */
  const { transparent } = useControls("Background", {
    transparent: true,
  });

  /* DayOrNight */
  useControls(
    "DayOrNight",
    {
      time: {
        value: 1,
        min: -1,
        max: 1,
        step: 0.01,
        onChange: (v) => {
          uniforms.uIsDay.value = v;
        },
      },
    },
    {
      collapsed: true,
    }
  );

  /* Outline */
  useControls(
    "OutLine",
    {
      lineWidth: {
        value: 0.3,
        min: 0,
        max: 1,
        step: 0.01,
        onChange: (v) => {
          outlineUniforms.uOutLineWidth.value = v;
        },
      },
    },
    {
      collapsed: true,
    }
  );

  /* AmbientLight */
  const { color, int } = useControls(
    "ambientLight",
    {
      color: {
        // #e5cebe
        // #ffffff
        // #ffe4e4
        value: "#fff3e3",
      },
      int: {
        // 。85
        // 1.02
        value: 1.02,
        min: 0,
        max: 2,
        step: 0.01,
      },
    },
    {
      collapsed: true,
    }
  );

  /* LightPosition */
  const { visible, position } = useControls(
    "Light",
    {
      visible: false,
      position: {
        value: { x: 0, y: 10, z: 10 },
        step: 0.01,
      },
      rotation: {
        value: 5.37,
        min: 0,
        max: Math.PI * 2,
        step: Math.PI / 100,
        onChange: (v) => {
          groupRef.current!.rotation.y = v;
        },
      },
    },
    {
      collapsed: true,
    }
  );

  /* Bloom */
  const {
    intensity,
    radius,
    luminanceThreshold,
    iteration,
    luminanceSmoothing,
    glowColor,
  } = useControls(
    "Bloom",
    {
      intensity: {
        // 1.6
        // 3.5
        // 2.32
        value: 2.26,
        min: 0,
        max: 10,
        step: 0.01,
      },
      radius: {
        // 0
        // 2.74
        // 4
        // 1.56
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
        disabled: true,
      },
      iteration: {
        // 3
        value: 7,
        min: 1,
        max: 10,
        step: 1,
      },
      glowColor: {
        // #d8b2b2
        // #6b3a3a
        value: "#6c5252",
      },
    },
    {
      collapsed: true,
    }
  );

  /* Shadow */
  useControls(
    "Shadow",
    {
      ShadowColor: {
        value: "white",
        onChange: (v) => {
          uniforms.uShadowColor.value = new Color(v);
        },
      },
    },
    {
      collapsed: true,
    }
  );

  /* Metal */
  useControls(
    "Metal",
    {
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
    },
    {
      collapsed: true,
    }
  );

  /* RimLight */
  useControls(
    "RimLight",
    {
      RimLightWidth: {
        // 0.12
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
    },
    {
      collapsed: true,
    }
  );

  /* GT ToneMap */
  const gtProps = useControls(
    "ToneMapGT",
    {
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
        // 1.69
        value: 1.3,
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
    },
    {
      collapsed: true,
    }
  );

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
            side: FrontSide,
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
    backModel.traverse((child) => {
      if (child instanceof Mesh) {
        const mat = new CustomShaderMaterial({
          baseMaterial: MeshBasicMaterial,
          uniforms: outlineUniforms,
          vertexShader: outlineVertexShader,
          fragmentShader: outlineFragmentShader,
          side: BackSide,
          vertexColors: true,
          silent: true,
          map: child.material.map,
          transparent: false,
          alphaTest: child.material.alphaTest,
        });
        child.material = mat;
      }
    });
    backModel.scale.setScalar(1.0001);
    backModel.position.copy(ayakaRef.current!.position);
    scene.add(backModel);
    gl.setClearColor(0x000000, 0);
    useLoadedStore.setState({ ready: true });

    return () => {
      scene.remove(backModel);
      backModel.traverse((child) => {
        if (child instanceof Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    };
  }, []);

  useFrame((state, delta) => {
    const { gl } = state;
    delta %= 1;
    const vec = LightPosRef.current;
    const dpr = gl.getPixelRatio();
    groupRef.current?.children[0].getWorldPosition(vec);
    uniforms.uLightPosition.value = vec;
    uniforms.uTime.value += delta;
    outlineUniforms.uResolution.value.set(innerWidth * dpr, innerHeight * dpr);
  });

  return (
    <>
      <OrbitControls
        domElement={controlDom}
        minDistance={0.5}
        maxDistance={10}
      />
      <ambientLight intensity={int} color={color} />
      {!transparent && (
        <Sky
          sunPosition={[0, 0, -1]}
          distance={50000}
          turbidity={8}
          rayleigh={6}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
      )}
      <primitive
        object={ayakaGltf.scene}
        ref={ayakaRef}
        position={[0, -0.7, 0]}
      />

      <group ref={groupRef} visible={visible}>
        <mesh
          position={[position.x, position.y, position.z]}
          scale={[0.2, 0.2, 0.2]}
        >
          <sphereGeometry></sphereGeometry>
          <meshBasicMaterial color={"hotpink"}></meshBasicMaterial>
        </mesh>
      </group>
      <EffectComposer disableNormalPass>
        <CustomBloom
          intensity={intensity}
          luminanceThreshold={luminanceThreshold}
          luminanceSmoothing={luminanceSmoothing}
          radius={radius}
          iteration={iteration}
          glowColor={glowColor}
          transparent={transparent}
        />
        <GTToneMap {...gtProps} />
        {/* <SMAA preset={SMAAPreset.MEDIUM} /> */}
      </EffectComposer>
    </>
  );
};

export default Sketch;
