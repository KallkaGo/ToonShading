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
  Vector3,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertexShader from "../shader/vertex.glsl";
import fragmentShader from "../shader/fragment.glsl";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import { color } from "three/examples/jsm/nodes/Nodes.js";

const Sketch = () => {
  const gltf = useGLTF("/face.glb");
  const ayakaGltf = useGLTF("/ayaka.glb");
  const faceLightMap = useTexture("/faceLightmap.png");
  faceLightMap.wrapS = faceLightMap.wrapT = RepeatWrapping;
  faceLightMap.generateMipmaps = false;
  faceLightMap.flipY = false;
  const groupRef = useRef<Group>(null);
  const controlDom = useInteractStore((state) => state.controlDom);

  const uniforms = useMemo(
    () => ({
      uLightPosition: new Uniform(new Vector3()),
      uFaceLightMap: new Uniform(faceLightMap),
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
    const modelParts = flatModel(gltf);
    printModel(modelParts);
    // const face = modelParts[1];
    // console.log("face", face);

    // face.material = newMat;

    useLoadedStore.setState({ ready: true });
  }, []);

  useLayoutEffect(() => {
    ayakaGltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        const mat = child.material as MeshStandardMaterial;
        if (mat.name === "face") {
          const newMat = new CustomShaderMaterial({
            baseMaterial: MeshBasicMaterial,
            vertexShader,
            fragmentShader,
            uniforms,
            map: mat.map,
            silent: true,
            transparent: mat.transparent,
            // side: DoubleSide,
          });
          child.material = newMat;
        } else {
          (child.material as MeshStandardMaterial).onBeforeCompile = (
            shader
          ) => {
            shader.uniforms.uLightPosition = uniforms.uLightPosition;

            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>
              varying vec3 vWorldNormal;
              `
            );

            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              /* glsl */ `
              #include <begin_vertex>
              vWorldNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
              `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <common>",
              /* glsl */ `
              #include <common>
              uniform vec3 uLightPosition;
              varying vec3 vWorldNormal;
              `
            );
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <opaque_fragment>",
              /* glsl */ `
              #include <opaque_fragment>
              vec3 nor = normalize(vWorldNormal);
              float NDotV = dot(nor, uLightPosition);
              float factor =  step(0.0, NDotV);
              vec3 baseColor = diffuseColor.rgb;
              vec3 darkColor = baseColor * 0.8;
              gl_FragColor = vec4(mix(darkColor, baseColor, factor), gl_FragColor.a);
              `
            );
          };
        }
      }
    });
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
      <color attach={"background"} args={["ivory"]} />
      {/* <primitive object={gltf.scene} scale={[2, 2, 2]} /> */}
      {/* <Environment preset={"city"} /> */}
      <primitive object={ayakaGltf.scene} />
      <group ref={groupRef} visible={false}>
        <mesh position={[0, 0, 1]} scale={[0.2, 0.2, 0.2]}>
          <sphereGeometry></sphereGeometry>
          <meshBasicMaterial color={"hotpink"}></meshBasicMaterial>
        </mesh>
      </group>
      <EffectComposer disableNormalPass multisampling={8}>
        <SMAA />
      </EffectComposer>
    </>
  );
};

export default Sketch;
