import { OrbitControls, Sky } from '@react-three/drei'
import { EffectComposer } from '@react-three/postprocessing'
import { useInteractStore, useLoadedStore } from '@utils/Store'
import { useControls } from 'leva'
import { useEffect } from 'react'

import { Bloom as CustomBloom } from '../effect/Bloom'
import GTToneMap from '../effect/GTToneMap'
import Ayaka from './items/Ayaka'

function Sketch() {
  const controlDom = useInteractStore(state => state.controlDom)

  /* Background */
  const { transparent } = useControls('Background', {
    transparent: true,
  })

  /* AmbientLight */
  const { color, int } = useControls(
    'ambientLight',
    {
      color: {
        // #e5cebe
        // #ffffff
        // #ffe4e4
        value: '#fff3e3',
      },
      int: {
        // 。85
        // 1.02
        value: 1.02,
        min: 0,
        max: 2,
        step: 0.01,
      },
    },
    {
      collapsed: true,
    },
  )

  /* Bloom */
  const bloomProps = useControls(
    'Bloom',
    {
      intensity: {
        // 1.6
        // 3.5
        // 2.32
        value: 2.26,
        min: 0,
        max: 10,
        step: 0.01,
      },
      radius: {
        // 0
        // 2.74
        // 4
        // 1.56
        value: 0,
        min: -10,
        max: 10,
        step: 0.01,
      },
      luminanceThreshold: {
        value: 0.75,
        min: 0,
        max: 1,
        step: 0.01,
      },
      luminanceSmoothing: {
        value: 0.05,
        min: 0,
        max: 1,
        step: 0.01,
        disabled: true,
      },
      iteration: {
        // 3
        value: 7,
        min: 1,
        max: 10,
        step: 1,
      },
      glowColor: {
        // #d8b2b2
        // #6b3a3a
        value: '#6c5252',
      },
    },
    {
      collapsed: true,
    },
  )

  /* GT ToneMap */
  const gtProps = useControls(
    'ToneMapGT',
    {
      MaxLuminanice: {
        value: 2,
        min: 1,
        max: 100,
        step: 0.01,
      },
      Contrast: {
        value: 1,
        min: 1,
        max: 5,
        step: 0.01,
      },
      LinearSectionStart: {
        value: 0.1,
        min: 0,
        max: 1,
        step: 0.01,
      },
      LinearSectionLength: {
        value: 0.12,
        min: 0,
        max: 0.99,
        step: 0.01,
      },
      BlackTightnessC: {
        // 1.69
        value: 1.2,
        min: 1,
        max: 3,
        step: 0.01,
      },
      BlackTightnessB: {
        value: 0.0,
        min: 0,
        max: 1,
        step: 0.25,
      },
      Enabled: true,
    },
    {
      collapsed: true,
    },
  )

  useEffect(() => {
    useLoadedStore.setState({ ready: true })
  }, [])

  return (
    <>
      <OrbitControls
        domElement={controlDom}
        minDistance={0.5}
        maxDistance={10}
      />
      <ambientLight intensity={int} color={color} />
      {!transparent && (
        <Sky
          sunPosition={[0, 0, -1]}
          distance={50000}
          turbidity={8}
          rayleigh={6}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
      )}
      <Ayaka />
      <EffectComposer disableNormalPass>
        <CustomBloom {...bloomProps} transparent={transparent} />
        <GTToneMap {...gtProps} />
      </EffectComposer>
    </>
  )
}

export default Sketch
