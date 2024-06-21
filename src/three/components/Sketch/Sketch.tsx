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
  Vector3,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertexShader from "../shader/vertex.glsl";
import FacefragmentShader from "../shader/face/fragment.glsl";
import OtherfragmentShader from "../shader/body/fragment.glsl";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import {
  Bloom,
  EffectComposer,
  SMAA,
  SelectiveBloom,
} from "@react-three/postprocessing";

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

  const { intensity, radius } = useControls("bloom", {
    intensity: {
      value: 1.41,
      min: 0,
      max: 10,
      step: 0.01,
    },
    radius: {
      value: 0.15,
      min: 0,
      max: 1,
      step: 0.01,
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
      value: 1.78,
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

  useEffect(() => {
    console.log("@@@@@", ayakaGltf);
    ayakaGltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        const mat = child.material as MeshStandardMaterial;
        if (mat.name === "face") {
          const newMat = new CustomShaderMaterial({
            baseMaterial: MeshStandardMaterial,
            vertexShader,
            fragmentShader: FacefragmentShader,
            uniforms,
            map: mat.map,
            silent: true,
            transparent: mat.transparent,
            // side: DoubleSide,
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
          if (mat.name === "hair" || mat.name === "hair_1") {
            child.material.uniforms.uLightMap = new Uniform(hairLightMap);
            child.material.uniforms.uRampMap = new Uniform(hairRampMap);
            child.material.uniforms.uNormalMap = new Uniform(hairNormalMap);
            child.material.uniforms.uEmissiveMap = new Uniform(null);
          } else if (mat.name === "body") {
            child.material.uniforms.uLightMap = new Uniform(bodyLightMap);
            child.material.uniforms.uRampMap = new Uniform(bodyRampMap);
            child.material.uniforms.uNormalMap = new Uniform(bodyNormalMap);
            child.material.uniforms.uEmissiveMap = new Uniform(bodyEmissiveMap);
          }
        }
      }
    });

    const backModel = ayakaGltf.scene.clone(true);
    backModel.traverse((child) => {
      if (child instanceof Mesh) {
        const mat = new ShaderMaterial({
          vertexShader: /* glsl */ `
          attribute vec3 _uv4;
          void main() {
            vec3 aveNormal = _uv4;
            vec3 transformed = position + aveNormal * .08/100.;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
          }  
          `,
          fragmentShader: /* glsl */ `
          void main(){
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          }
          `,
          side: BackSide,
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
  });

  return (
    <>
      <OrbitControls domElement={controlDom} />
      <color attach={"background"} args={["black"]} />
      {/* <primitive object={gltf.scene} scale={[2, 2, 2]} /> */}
      {/* <Environment preset={"city"} /> */}
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
      <EffectComposer
        disableNormalPass
        multisampling={8}
        frameBufferType={UnsignedByteType}
      >
        <Bloom
          ref={bloomRef}
          luminanceThreshold={0.73}
          luminanceSmoothing={0.56}
          intensity={intensity}
          mipmapBlur
          radius={radius}
        />
        <SMAA />
      </EffectComposer>
    </>
  );
};

export default Sketch;
