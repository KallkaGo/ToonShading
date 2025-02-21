import useKTX2Loader from "@utils/useKTX2Loader";
import RES from "../RES";
import { useTexture } from "@react-three/drei";
import {
  BackSide,
  Color,
  FrontSide,
  Group,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  Uniform,
  Vector2,
  Vector3,
} from "three";
import { useEffect, useMemo, useRef } from "react";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { useInteractStore } from "@utils/Store";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { useDepthTexture } from "@utils/useDepthTexture";
import vertexShader from "../../shader/vertex.glsl";
import FacefragmentShader from "../../shader/face/fragment.glsl";
import OtherfragmentShader from "../../shader/body/fragment.glsl";
import outlineVertexShader from "../../shader/outline/vertex.glsl";
import outlineFragmentShader from "../../shader/outline/fragment.glsl";
import { useShallow } from "zustand/react/shallow";

const textureList = [
  RES.texture.faceLightMap,
  RES.texture.hairLightMap,
  RES.texture.bodyLightMap,
  RES.texture.hairRampMap,
  RES.texture.emissiveMap,
  RES.texture.bodyRampMap,
  RES.texture.matcapMap,
  RES.texture.hairNormalMap,
  RES.texture.bodyNormalMap,
];

const Ayaka = () => {
  const ayakaGltf = useKTX2Loader(RES.model.ayaka);

  const [
    faceLightMap,
    hairLightMap,
    bodyLightMap,
    hairRampMap,
    bodyEmissiveMap,
    bodyRampMap,
    metalMap,
    hairNormalMap,
    bodyNormalMap,
  ] = useTexture(textureList);

  faceLightMap.colorSpace = LinearSRGBColorSpace;
  faceLightMap.generateMipmaps = false;
  faceLightMap.flipY = false;

  hairLightMap.flipY = false;
  hairLightMap.generateMipmaps = false;
  hairLightMap.colorSpace = LinearSRGBColorSpace;

  bodyLightMap.flipY = false;
  bodyLightMap.generateMipmaps = false;
  bodyLightMap.colorSpace = LinearSRGBColorSpace;

  hairRampMap.generateMipmaps = false;
  hairRampMap.colorSpace = SRGBColorSpace;

  bodyEmissiveMap.flipY = false;
  bodyEmissiveMap.colorSpace = SRGBColorSpace;

  bodyRampMap.colorSpace = SRGBColorSpace;
  bodyRampMap.generateMipmaps = false;

  hairNormalMap.flipY = false;

  bodyNormalMap.flipY = false;

  const ayakaRef = useRef<Group>(null);
  const groupRef = useRef<Group>(null);
  const LightPosRef = useRef<Vector3>(new Vector3());
  const { scene, camera, gl } = useThree(
    useShallow((state) => ({
      scene: state.scene,
      camera: state.camera,
      gl: state.gl,
    }))
  );

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
      uIntensity: new Uniform(2),
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

  /* LightPosition */
  const { visible, position } = useControls(
    "Light",
    {
      visible: false,
      position: {
        value: { x: 0, y: 5, z: 5 },
        step: 0.01,
      },
      rotation: {
        value: 5.72,
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

  useControls("sdfPow", {
    powIntensity: {
      value: 1.5,
      min: 1.0,
      max: 5.0,
      step: 0.01,
      onChange: (v) => {
        uniforms.uIntensity.value = v;
      },
    },
  });

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

  useFrame((_, delta) => {
    delta %= 1;
    const vec = LightPosRef.current;
    const dpr = gl.getPixelRatio();
    groupRef.current?.children[0].getWorldPosition(vec);
    uniforms.uLightPosition.value.copy(vec);
    uniforms.uTime.value += delta;
    outlineUniforms.uResolution.value.set(innerWidth * dpr, innerHeight * dpr);
  });

  return (
    <>
      <group ref={groupRef} visible={visible}>
        <mesh
          position={[position.x, position.y, position.z]}
          scale={[0.2, 0.2, 0.2]}
        >
          <sphereGeometry></sphereGeometry>
          <meshBasicMaterial color={"hotpink"}></meshBasicMaterial>
        </mesh>
      </group>
      <primitive
        object={ayakaGltf.scene}
        ref={ayakaRef}
        position={[0, -0.7, 0]}
      />
    </>
  );
};

export default Ayaka;
