import type { PointerEvent } from 'react'
import { useGSAP } from '@gsap/react'
import { useInteractStore } from '@utils/Store'
import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { GameWrapper } from './style'

function Game() {
  const controlRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<HTMLDivElement>(null)
  const aniDone = useRef(false)

  const [activeIndex, setActiveIndex] = useState(0)

  useGSAP(() => {
    gsap.set(gameRef.current, { opacity: 0 })
    gsap.to(gameRef.current, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        aniDone.current = true
      },
    })
  })

  useEffect(() => {
    useInteractStore.setState({ controlDom: controlRef.current! })
  }, [])

  const handlePointerEvent = (e: PointerEvent, flag: boolean) => {
    useInteractStore.setState({ touch: flag })
  }

  return (
    <GameWrapper className="game" ref={gameRef}>
      <div
        className="control"
        ref={controlRef}
        onPointerDown={e => handlePointerEvent(e, true)}
        onPointerUp={e => handlePointerEvent(e, false)}
      >
      </div>
    </GameWrapper>
  )
}

export default Game
