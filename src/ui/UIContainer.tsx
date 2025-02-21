import type {
  PointerEventHandler,
} from 'react'
import type { PageActionType } from './Reducer'
import bgSrc from '@textures/bg/bg.jpg'
import { useInteractStore } from '@utils/Store'
import { PreloadImages } from '@utils/usePreload'
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react'
import Game from './game/Game'
import Load from './load/Load'
import { initialState, reducer } from './Reducer'
import { UIWrapper } from './style'

export default function UIContainer() {
  const { isMute, audioAllowed, browserHidden } = useInteractStore(state => ({
    isMute: state.isMute,
    audioAllowed: state.audioAllowed,
    browserHidden: state.browserHidden,
  }))
  const [state, dispatch] = useReducer(reducer, initialState)

  const container = useRef<Div>(null)

  useEffect(() => {
    async function preload() {
      await PreloadImages([bgSrc])

      const root = container.current!.parentElement!

      root.style.backgroundImage = `url(${bgSrc})`

      root.style.backgroundSize = '100% 100%'
    }

    preload()
  }, [])

  useEffect(() => {
    if (audioAllowed) {
      // TODO:播放音乐
    }
  }, [audioAllowed])

  const handleEmit = useCallback((type: PageActionType, payload?: any) => {
    dispatch({ type, payload })
  }, [])

  /*
    防止页面消失失去抬起事件的处理
    通过冒泡 处理抬起事件 */
  const handlePointerUp: PointerEventHandler = (e) => {
    useInteractStore.setState({ touch: false })
  }

  return (
    <UIWrapper id="panel" ref={container} onPointerUp={handlePointerUp}>
      <div className="info">
        <span>
          Toon Shading - by
          {' '}
          <a href="https://github.com/KallkaGo">Kallka</a>
        </span>
      </div>
      {state.game && <Game />}
      {state.load && <Load emit={handleEmit} />}
    </UIWrapper>
    /*
        音乐示例
         <audio
                ref={musicRef}
                src={bgm}
                loop
                muted={isMute || !audioAllowed || browserHidden}
            />
         */
  )
}
