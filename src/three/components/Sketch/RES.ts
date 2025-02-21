import ayaka from '@models/ayakaktx2opt.glb'
import emissiveMap from '@textures/body/emissive.png'
import bodyLightMap from '@textures/body/light.png'
import bodyNormalMap from '@textures/body/normal.png'
import bodyRampMap from '@textures/body/ramp.png'
import faceLightMap from '@textures/face/faceLightmap.png'
import hairLightMap from '@textures/hair/light.png'
import hairNormalMap from '@textures/hair/normal.png'
import hairRampMap from '@textures/hair/ramp.png'
import matcapMap from '@textures/matcap/metalMap.png'

export default {
  model: {
    ayaka,
  },
  texture: {
    faceLightMap,
    hairLightMap,
    bodyLightMap,
    hairRampMap,
    bodyRampMap,
    emissiveMap,
    matcapMap,
    hairNormalMap,
    bodyNormalMap,
  },
}
