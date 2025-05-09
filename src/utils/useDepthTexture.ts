import type { Object3D, Texture } from 'three'
import { useFBO } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { Color, DepthFormat, DepthTexture, DoubleSide, MeshDepthMaterial, UnsignedShortType } from 'three'

function useDepthTexture(width: number, height: number, ignoreList: Object3D[] = []) {
  const camera = useThree(state => state.camera)

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
  const bgColor = new Color(0x000000)

  /*
  without overrideMaterial will not work
  need two RenderTarget and swap after render
  */
  useFrame((state, delta) => {
    const { gl, scene } = state
    const dpr = gl.getPixelRatio()

    rt1.depthTexture.image.width = innerWidth * dpr
    rt1.depthTexture.image.height = innerHeight * dpr
    rt1.setSize(innerWidth * dpr, innerHeight * dpr)

    const originalBg = scene.background
    scene.background ??= bgColor
    scene.overrideMaterial = material

    ignoreList.forEach(obj => {
      obj.visible = false
    })

    gl.setRenderTarget(rt1)
    gl.render(scene, camera)
    gl.setRenderTarget(null)

    scene.overrideMaterial = null
    scene.background = originalBg

    ignoreList.forEach(obj => {
      obj.visible = true
    })

  })

  return { depthTexture: rt1.depthTexture as Texture }
}

export {
  useDepthTexture,
}
