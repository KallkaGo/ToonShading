import BrowserUtil from '@utils/Browser'
import { useEffect } from 'react'
import ThreeContainer from './three/ThreeContainer'
import UIContainer from './ui/UIContainer'

export default function App() {
  useEffect(() => {
    BrowserUtil.init()
  }, [])

  return (
    <>
      {/* 3D场景层 */}
      <ThreeContainer />
      {/* UI界面层 */}
      <UIContainer />
    </>
  )
}
