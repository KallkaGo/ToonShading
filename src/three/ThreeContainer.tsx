import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { useInteractStore } from "@utils/Store";
import { Perf } from "r3f-perf";
import { Leva } from "leva";
import Sketch from "./components/Sketch/Sketch";
import { NoToneMapping } from "three";
export default function ThreeContainer() {
  const demand = useInteractStore((state) => state.demand);
  return (
    <>
      <Leva collapsed hidden={location.hash !== "#debug"} />
      <Canvas
        frameloop={demand ? "never" : "always"}
        className="webgl"
        dpr={[1.25, 2]}
        camera={{
          fov: 50,
          near: 0.1,
          position: [0, 0, 2],
          far: 200,
        }}
        gl={{toneMapping:NoToneMapping}}
      >
        {location.hash.includes("debug") && <Perf position="top-left" />}
        <Suspense fallback={null}>
          <Sketch />
        </Suspense>
      </Canvas>
    </>
  );
}
