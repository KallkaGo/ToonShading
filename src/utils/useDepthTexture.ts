import { useFBO } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useMemo } from "react"
import { DepthFormat, DepthTexture, NearestFilter, RGBAFormat, ShaderMaterial, Texture, Uniform, UnsignedByteType, UnsignedShortType } from "three"
import vertexShader from '@/three/components/shader/depthTex/vertex.glsl'
import fragmentShader from '@/three/components/shader/depthTex/fragment.glsl'
import { FullScreenQuad } from "three/examples/jsm/Addons.js"





const useDepthTexture = (width: number, height: number) => {

  const camera = useThree((state) => state.camera)

  const rt1 = useFBO(width, height, {
    depthBuffer: true,
    stencilBuffer: false,
    depthTexture: new DepthTexture(width, height),
    generateMipmaps: false,
    format: RGBAFormat,
  })
  rt1.depthTexture.format = DepthFormat
  rt1.depthTexture.type = UnsignedShortType

  const rt2 = useFBO(width, height, {
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
    samples: 16,
    format: RGBAFormat,
  })


  const uniforms = useMemo(() => ({
    tDiffuse: new Uniform(rt1.texture),
    tDepth: new Uniform(rt1.depthTexture),
    cameraNear: new Uniform(1),
    cameraFar: new Uniform(10)
  }), [])

  const material = useMemo(() => new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms
  }), [])

  const fullScreenQuad = useMemo(() => new FullScreenQuad(material), [])

  useFrame((state, delta) => {
    const { gl, scene } = state
    const dpr = gl.getPixelRatio()
    rt1.setSize(innerWidth * dpr, innerHeight * dpr)
    rt2.setSize(innerWidth * dpr, innerHeight * dpr)
    gl.setRenderTarget(rt1)
    gl.render(scene, camera)
    gl.setRenderTarget(rt2)
    uniforms.tDepth.value = rt1.depthTexture
    uniforms.tDiffuse.value = rt1.texture
    fullScreenQuad.render(gl)
    gl.setRenderTarget(null)
  })

  return { depthTexture: rt2.texture as Texture }

}


export {
  useDepthTexture
}