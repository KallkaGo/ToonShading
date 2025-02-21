import type { ObjectMap } from '@react-three/fiber'
import type { Mesh, Object3D } from 'three'
import type { GLTF } from 'three-stdlib'

// 打印扁平模型的所有部分
function printModel(modelParts: Object3D[], modelName = 'modelParts') {
  const strArray = modelParts.map((obj, i) => {
    const row = `const ${obj.name} = ${modelName}[${i}]-${obj.type};`
    return row
  })
  const str = strArray.join('\n')
  console.log(str)
  return str
}

// 扁平化模型
function flatModel(gltf: GLTF & ObjectMap) {
  const modelArr: Mesh[] = []
  gltf.scene.traverse((child) => {
    modelArr.push(child as Mesh)
  })
  return modelArr
}

export {
  flatModel,
  printModel,
}
