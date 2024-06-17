import {
  Environment,
  OrbitControls,
  Sky,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { useInteractStore, useLoadedStore } from "@utils/Store";
import { flatModel, printModel } from "@utils/misc";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  RepeatWrapping,
  Uniform,
  UnsignedByteType,
  Vector3,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertexShader from "../shader/vertex.glsl";
import FacefragmentShader from "../shader/face/fragment.glsl";
import OtherfragmentShader from "../shader/other/fragment.glsl";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { Bloom, EffectComposer, SMAA } from "@react-three/postprocessing";

const Sketch = () => {
  const ayakaGltf = useGLTF("/ayaka.glb");
  const faceLightMap = useTexture("/Face/faceLightmap.png");
  faceLightMap.wrapS = faceLightMap.wrapT = RepeatWrapping;
  faceLightMap.generateMipmaps = false;
  faceLightMap.flipY = false;
  const hairLightMap = useTexture("/Hair/light.png");
  hairLightMap.flipY = true;
  const bodyLightMap = useTexture("/Body/light.png");
  bodyLightMap.flipY = true;

  const hairRampMap = useTexture("/Hair/ramp.png");
  // hairRampMap.flipY = true;
  const bodyRampMap = useTexture("/Body/ramp.png");
  // bodyRampMap.flipY = true;
  const groupRef = useRef<Group>(null);
  const controlDom = useInteractStore((state) => state.controlDom);

  const uniforms = useMemo(
    () => ({
      uLightPosition: new Uniform(new Vector3()),
      uFaceLightMap: new Uniform(faceLightMap),
      uRampVmove: new Uniform(0.5), //白天
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

  useEffect(() => {
    ayakaGltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        const mat = child.material as MeshStandardMaterial;
        if (mat.name === "face") {
          const newMat = new CustomShaderMaterial({
            baseMaterial: MeshBasicMaterial,
            vertexShader,
            fragmentShader: FacefragmentShader,
            uniforms,
            map: mat.map,
            silent: true,
            transparent: mat.transparent,
            // side: DoubleSide,
          });
          child.material = newMat;
        } else {
          child.material = new CustomShaderMaterial({
            name: mat.name,
            baseMaterial: MeshBasicMaterial,
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
          if (mat.name === "hair") {
            child.material.uniforms.uLightMap = new Uniform(hairLightMap);
            child.material.uniforms.uRampMap = new Uniform(hairRampMap);
          } else {
            child.material.uniforms.uLightMap = new Uniform(bodyLightMap);
            child.material.uniforms.uRampMap = new Uniform(bodyRampMap);
          }
        }
      }
    });
    useLoadedStore.setState({ ready: true });
  }, []);

  useFrame((state, delta) => {
    const vec = new Vector3();
    groupRef.current?.children[0].getWorldPosition(vec);
    uniforms.uLightPosition.value = vec;
    // groupRef.current!.rotation.y += delta;
  });

  return (
    <>
      <OrbitControls domElement={controlDom} />
      <color attach={"background"} args={["black"]} />
      {/* <primitive object={gltf.scene} scale={[2, 2, 2]} /> */}
      {/* <Environment preset={"city"} /> */}
      <primitive object={ayakaGltf.scene} />
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
          luminanceThreshold={0.73}
          luminanceSmoothing={0.56}
          intensity={1.2}
          mipmapBlur
          radius={0.2}
        />
        <SMAA />
      </EffectComposer>
    </>
  );
};

export default Sketch;
