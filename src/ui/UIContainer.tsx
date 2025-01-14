import {
  PointerEventHandler,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { UIWrapper } from "./style";
import { PageActionType, initialState, reducer } from "./Reducer";
import Game from "./game/Game";
import Load from "./load/Load";
import { useInteractStore } from "@utils/Store";
import bgSrc from "@textures/bg/bg.jpg";
import { usePreloadImages } from "@utils/usePreload";
export default function UIContainer() {
  const { isMute, audioAllowed, browserHidden } = useInteractStore((state) => ({
    isMute: state.isMute,
    audioAllowed: state.audioAllowed,
    browserHidden: state.browserHidden,
  }));
  const [state, dispatch] = useReducer(reducer, initialState);

  const container = useRef<Div>(null);

  useEffect(() => {
    async function preload() {
      await usePreloadImages([bgSrc]);

      const root = container.current?.parentElement!;

      root.style.backgroundImage = `url(${bgSrc})`;

      root.style.backgroundSize = "100% 100%";
    }

    preload();
  }, []);

  useEffect(() => {
    if (audioAllowed) {
      //TODO:播放音乐
    }
  }, [audioAllowed]);

  const handleEmit = useCallback((type: PageActionType, payload?: any) => {
    dispatch({ type, payload });
  }, []);

  /*
    防止页面消失失去抬起事件的处理 
    通过冒泡 处理抬起事件 */
  const handlePointerUp: PointerEventHandler = (e) => {
    useInteractStore.setState({ touch: false });
  };

  return (
    <>
      <UIWrapper id="panel" ref={container} onPointerUp={handlePointerUp}>
        <div className="info">
          <span>
            Toon Shading - by <a href="https://github.com/KallkaGo">Kallka</a>
          </span>
        </div>
        {state.game && <Game />}
        {state.load && <Load emit={handleEmit} />}
      </UIWrapper>
    </>
    /* 
        音乐示例
         <audio
                ref={musicRef}
                src={bgm}
                loop
                muted={isMute || !audioAllowed || browserHidden}
            />
         */
  );
}
