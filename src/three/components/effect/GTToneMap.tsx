import { Effect } from 'postprocessing'
import { useMemo } from 'react'
import { Uniform } from 'three'
import fragmenrShader from '../shader/toneMap/fragment.glsl'

interface IProps {
  MaxLuminanice?: number
  Contrast?: number
  LinearSectionStart?: number
  LinearSectionLength?: number
  BlackTightnessC?: number
  BlackTightnessB?: number
  Enabled?: boolean
}

class GTToneMapEffect extends Effect {
  constructor(props: IProps) {
    super('GTToneMap', fragmenrShader, {
      uniforms: new Map([
        ['uMaxLuminanice', new Uniform(props.MaxLuminanice)],
        ['uContrast', new Uniform(props.Contrast)],
        ['uLinearSectionStart', new Uniform(props.LinearSectionStart)],
        ['uLinearSectionLength', new Uniform(props.LinearSectionLength)],
        ['uBlackTightnessC', new Uniform(props.BlackTightnessC)],
        ['uBlackTightnessB', new Uniform(props.BlackTightnessB)],
        ['uEnabled', new Uniform(props.Enabled ? 1 : 0)],
      ]),
    })
  }
}

export default function GTToneMap(
  props: IProps = {
    MaxLuminanice: 1.0,
    Contrast: 1.0,
    LinearSectionStart: 0.22,
    LinearSectionLength: 0.4,
    BlackTightnessC: 1.33,
    BlackTightnessB: 0.0,
    Enabled: true,
  },
) {
  const effect = useMemo(() => {
    return new GTToneMapEffect(props)
  }, [props])
  return <primitive object={effect} dispose={null} />
}
