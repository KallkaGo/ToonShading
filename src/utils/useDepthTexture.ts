import { useFBO } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useMemo } from "react"
import { DepthFormat, DepthTexture, DoubleSide, MeshDepthMaterial, NearestFilter, RGBAFormat, ShaderMaterial, Texture, Uniform, UnsignedByteType, UnsignedShortType } from "three"

const useDepthTexture = (width: number, height: number) => {

  const camera = useThree((state) => state.camera)

  const rt1 = useFBO(width, height, {
    depthBuffer: true,
    stencilBuffer: false,
    depthTexture: new DepthTexture(width, height),
    generateMipmaps: false,
  })
  rt1.depthTexture.format = DepthFormat
  rt1.depthTexture.type = UnsignedShortType



  const material = useMemo(() => new MeshDepthMaterial({
    side: DoubleSide,
  }), [])

  /* 
  without overrideMaterial will not work 
  need two RenderTarget and swap after render
  */
  useFrame((state, delta) => {
    const { gl, scene } = state
    const dpr = gl.getPixelRatio()
    rt1.setSize(innerWidth * dpr, innerHeight * dpr)
    scene.overrideMaterial = material
    gl.setRenderTarget(rt1)
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    scene.overrideMaterial = null
  })

  return { depthTexture: rt1.depthTexture as Texture }

}


export {
  useDepthTexture
}