import { useFBO } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useMemo } from "react"
import { DepthTexture, ShaderMaterial, Texture, Uniform } from "three"
import vertexShader from '@/three/components/shader/depthTex/vertex.glsl'
import fragmentShader from '@/three/components/shader/depthTex/fragment.glsl'
import { FullScreenQuad } from "three/examples/jsm/Addons.js"





const useDepthTexture = (width: number, height: number) => {

  const camera = useThree((state) => state.camera)

  const rt1 = useFBO(width, height, {
    depthBuffer: true,
    depthTexture: new DepthTexture(width, height),
  })

  const rt2 = useFBO(width, height, {
    depthBuffer: true,
    depthTexture: new DepthTexture(width, height),
  })

  const uniforms = useMemo(() => ({
    tDiffuse: new Uniform(rt1.texture),
    tDepth: new Uniform(rt1.depthTexture),
    cameraFar: new Uniform(camera.far),
    cameraNear: new Uniform(camera.near)
  }), [])

  const material = useMemo(() => new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms
  }), [])

  const fullScreenQuad = useMemo(() => new FullScreenQuad(material), [])

  useFrame((state, delta) => {
    const { gl, scene } = state
    gl.setRenderTarget(rt1)
    gl.render(scene, camera)
    gl.setRenderTarget(rt2)
    uniforms.tDepth.value = rt1.depthTexture
    uniforms.tDiffuse.value = rt1.texture
    fullScreenQuad.render(gl)
    gl.setRenderTarget(null)
  })

  return { depthTexture: rt2.texture }

}


export {
  useDepthTexture
}