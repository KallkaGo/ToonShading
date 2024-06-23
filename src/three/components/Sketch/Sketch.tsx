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
  Vector2,
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
  ToneMapping,
} from "@react-three/postprocessing";
import GTToneMap from "../effect/GTToneMap";

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
      uOutLineWidth: new Uniform(0.3),
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

  const gtProps = useControls("ToneMap", {
    MaxLuminanice: {
      value: 3,
      min: 1,
      max: 100,
      step: 0.01,
    },
    Contrast: {
      value: 1.3,
      min: 1,
      max: 5,
      step: 0.01,
    },
    LinearSectionStart: {
      value: 0.85,
      min: 0,
      max: 1,
      step: 0.01,
    },
    LinearSectionLength: {
      value: 0.4,
      min: 0,
      max: .99,
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

    backModel.traverse((child) => {
      if (child instanceof Mesh) {
        console.log("child.material.name", child.material.name);
        if (child.material.name !== "face") {
        }
        const mat = new ShaderMaterial({
          uniforms: outlineUniforms,
          vertexShader: /* glsl */ `
          attribute vec3 _uv4;
          attribute vec4 color;
          uniform float uOutLineWidth;
          uniform vec2 uResolution;
          varying vec4 vColor;
          void main() {
            vec3 aveNormal = _uv4;
            vec3 transformed = position;
            vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
            vec3 viewNormal  = normalize(normalMatrix * aveNormal);
            vec4 clipNormal  = projectionMatrix  * vec4(viewNormal, 0.0);
            vec3 ndcNormal  = clipNormal.xyz * clipPosition.w;
            float aspect = abs(uResolution.y / uResolution.x);
            clipNormal.x *= aspect;
            clipPosition.xy +=0.01*uOutLineWidth*ndcNormal.xy * color.a;
            clipPosition.z += 0.0001 * ndcNormal.z;
            gl_Position = clipPosition;
            vColor= color;
          }  
          `,
          fragmentShader: /* glsl */ `
          varying vec4 vColor;
          void main(){
            gl_FragColor = vec4(0.1, 0.1, 0.1, 1.);
            // gl_FragColor = vec4(vec3(vColor.rgb), 1.);

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
    outlineUniforms.uResolution.value.set(innerWidth, innerHeight);
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
        <GTToneMap {...gtProps} />
        {/* <ToneMapping /> */}
      </EffectComposer>
    </>
  );
};

export default Sketch;
