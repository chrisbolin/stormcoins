import {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Dispatch, ReactNode } from "react";
import "./App.css";
import {
  initialGameState,
  isOverPlatform,
  isReset,
  useGameLoop,
  nextLevel,
  startEngine,
  stopEngine,
} from "./gameLoop";
import type { GameAction } from "./gameLoop";
import { boltCells, coinTarget, drawBolt } from "./lightning";
import { skyColor } from "./skyColor";
import { useTextLayout } from "./textLayout";
import type { TextLayout } from "./textLayout";
import {
  ART_PIXEL,
  CRASH_SPRITE_HEIGHT,
  CRASH_SPRITE_WIDTH,
  DECK_LIFT,
  PLATFORM_LEFT,
  PLATFORM_SPRITE_HEIGHT,
  PLATFORM_SPRITE_WIDTH,
  PLATFORM_WIDTH,
  SCENE_WIDTH,
  VEHICLE_WIDTH,
  VEHICLE_HEIGHT,
  COIN_HEIGHT,
  COIN_WIDTH,
} from "./constants";
import {
  RAIN_CANVAS_HEIGHT,
  RAIN_CANVAS_WIDTH,
  RAIN_FRAME_DURATION,
  drawRain,
  rainForLevel,
} from "./rain";

// game units to CSS: the square screen is 100 units on each side
const units = (n: number) => `calc(var(--unit) * ${n})`;

const DispatchContext = createContext<Dispatch<GameAction>>(() => {});
const StateContext = createContext(initialGameState);

function addGlobalListeners(dispatch: Dispatch<GameAction>) {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Space") dispatch(startEngine);
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.code === "Space") dispatch(stopEngine);
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
}

// redraws only on a new animation frame, and picks up a new level's rain only
// when the level changes
function Rain({ front }: { front: boolean }) {
  const { level } = useContext(StateContext);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const rain = rainForLevel(level);
    let shownFrame = -1;
    let request = window.requestAnimationFrame(function draw(timestamp) {
      const frame = Math.floor(timestamp / RAIN_FRAME_DURATION);
      if (frame !== shownFrame) {
        shownFrame = frame;
        drawRain(context, rain, frame, front);
      }
      request = window.requestAnimationFrame(draw);
    });
    return () => window.cancelAnimationFrame(request);
  }, [level, front]);

  return (
    <canvas
      ref={canvas}
      className="rain"
      width={RAIN_CANVAS_WIDTH}
      height={RAIN_CANVAS_HEIGHT}
      style={{
        width: units(RAIN_CANVAS_WIDTH * ART_PIXEL),
        height: units(RAIN_CANVAS_HEIGHT * ART_PIXEL),
      }}
    />
  );
}

function Platform() {
  return (
    <div
      className="platform"
      style={{
        // the sprite is a hair wider than the landing zone; keep it centered
        left: units(PLATFORM_LEFT - (PLATFORM_SPRITE_WIDTH - PLATFORM_WIDTH) / 2),
        width: units(PLATFORM_SPRITE_WIDTH),
        height: units(PLATFORM_SPRITE_HEIGHT),
      }}
    />
  );
}

function Crash() {
  const { crashedAt, crashX } = useContext(StateContext);
  if (crashedAt === null) return null;
  const left = crashX + VEHICLE_WIDTH / 2 - CRASH_SPRITE_WIDTH / 2;
  // the blast is wide, so wrap it around the screen like the copter
  return (
    <>
      {[left - SCENE_WIDTH, left, left + SCENE_WIDTH].map((x) => (
        <div
          key={x}
          className="crash"
          style={{
            left: units(x),
            bottom: units(isOverPlatform(crashX) ? DECK_LIFT : 0),
            width: units(CRASH_SPRITE_WIDTH),
            height: units(CRASH_SPRITE_HEIGHT),
          }}
        />
      ))}
    </>
  );
}

function Vehicle() {
  const { positionX, positionY, crashedAt } = useContext(StateContext);
  if (crashedAt !== null) return null;
  // render two copters, so that when the player "wraps around" the screen it's fluid
  const bottom = units(positionY + DECK_LIFT);
  const width = units(VEHICLE_WIDTH);
  const height = units(VEHICLE_HEIGHT);
  return (
    <>
      <div
        className="vehicle"
        style={{ left: units(positionX), bottom, width, height }}
      />
      <div
        className="vehicle"
        style={{ left: units(positionX - 100), bottom, width, height }}
      />
    </>
  );
}

function Coin() {
  const { coinX, coinY, coinVisible } = useContext(StateContext);
  if (!coinVisible) return null;
  return (
    <div
      className="coin"
      style={{
        left: units(coinX),
        bottom: units(coinY + DECK_LIFT),
        width: units(COIN_WIDTH),
        height: units(COIN_HEIGHT),
      }}
    />
  );
}

function Debug() {
  const state = useContext(StateContext);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // ignore key repeat, so holding the key doesn't flicker the panel
      if (event.key.toLowerCase() === "d" && !event.repeat) {
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!visible) return null;
  return (
    <pre style={{ margin: 0, position: "absolute", bottom: 0, left: 0 }}>
      {JSON.stringify(state, null, 2)}
    </pre>
  );
}

function Instructions() {
  return (
    <div className="instructions">
      Get coin.
      <br />
      Land slowly.
      <br />
      Tap or spacebar.
    </div>
  );
}

function Dashboard({ layout }: { layout: TextLayout }) {
  const {
    score,
    bestScore,
    lastScore,
    windVelocityX,
    velocityX,
  } = useContext(StateContext);
  const speed = Math.round(velocityX * 1000);
  const wind = Math.round(windVelocityX * 1000);

  return (
    <>
      <div className="hud">
        <div className="hud-score">score: {score}</div>
        {layout === "side" ? (
          <>
            <div>best: {bestScore}</div>
            <div>last: {lastScore}</div>
            <div>speed: {speed}</div>
            <div>wind: {wind}</div>
          </>
        ) : (
          <>
            <div>
              best: {bestScore} · last: {lastScore}
            </div>
            <div>
              speed: {speed} · wind: {wind}
            </div>
          </>
        )}
      </div>
      <Instructions />
    </>
  );
}

function GamePad() {
  const dispatch = useContext(DispatchContext);
  return (
    <div
      className="GamePad"
      onPointerDown={(event) => {
        if (event.button !== 0) return; // ignore right and middle clicks
        // keep receiving events if the mouse is released outside the window
        event.currentTarget.setPointerCapture(event.pointerId);
        dispatch(startEngine);
      }}
      onPointerUp={() => dispatch(stopEngine)}
      onPointerCancel={() => dispatch(stopEngine)}
    />
  );
}

// Each new level arrives with a lightning strike on the new coin, and so does
// going back to level 1 after a crash or flying away. The flash hides the sky
// and rain changing underneath. Keyed by strike, so each one plays once.
function Lightning() {
  const { crashedAt, level, coinX, coinY } = useContext(StateContext);
  const [previous, setPrevious] = useState({ crashedAt, level });
  const [strikes, setStrikes] = useState(0);
  if (previous.crashedAt !== crashedAt || previous.level !== level) {
    setPrevious({ crashedAt, level });
    if (level > previous.level || isReset(previous, { crashedAt, level })) {
      setStrikes(strikes + 1);
    }
  }
  if (strikes === 0) return null;
  return <Strike key={strikes} level={level} coinX={coinX} coinY={coinY} />;
}

function Strike({
  level,
  coinX,
  coinY,
}: {
  level: number;
  coinX: number;
  coinY: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (context) drawBolt(context, boltCells(level, coinTarget(coinX, coinY)));
  }, [level, coinX, coinY]);
  return (
    <>
      <div className="flash" />
      <canvas
        ref={canvas}
        className="rain bolt"
        width={RAIN_CANVAS_WIDTH}
        height={RAIN_CANVAS_HEIGHT}
        style={{
          width: units(RAIN_CANVAS_WIDTH * ART_PIXEL),
          height: units(RAIN_CANVAS_HEIGHT * ART_PIXEL),
        }}
      />
    </>
  );
}

// preview builds (VITE_PREVIEW=1) get a button to skip to the next level
const PREVIEW = import.meta.env.VITE_PREVIEW === "1";

function PreviewControls() {
  const dispatch = useContext(DispatchContext);
  const { level } = useContext(StateContext);
  return (
    <button
      type="button"
      className="preview-next"
      tabIndex={-1}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => dispatch(nextLevel)}
    >
      level {level} → {level + 1}
    </button>
  );
}

function Sky({ children }: { children: ReactNode }) {
  const { level } = useContext(StateContext);
  return (
    <div className="sky" style={{ backgroundColor: skyColor(level) }}>
      {children}
    </div>
  );
}

const Scene = memo(function () {
  return (
    <div className="scene">
      <Sky>
        <Rain front={false} />
        <Platform />
        <Coin />
        <Vehicle />
        <Crash />
        <Rain front={true} />
        <Lightning />
      </Sky>
      <Debug />
      <GamePad />
    </div>
  );
});

function getLocalStorageNumber(key: string): number {
  return parseFloat(localStorage.getItem(key) || "") || 0;
}

function setLocalStorageNumber(key: string, x: number): void {
  localStorage.setItem(key, x.toString());
}

function App() {
  const layout = useTextLayout();
  const [state, dispatch] = useGameLoop(() => {
    const bestScore = getLocalStorageNumber("bestScore");
    const lastScore = getLocalStorageNumber("lastScore");
    return { bestScore, lastScore };
  });

  useEffect(() => {
    const removeGlobalListeners = addGlobalListeners(dispatch);
    return removeGlobalListeners;
  }, [dispatch]);

  useEffect(() => {
    setLocalStorageNumber("bestScore", state.bestScore);
    setLocalStorageNumber("lastScore", state.lastScore);
  }, [state.lastScore, state.bestScore]);

  return (
    <DispatchContext value={dispatch}>
      <StateContext value={state}>
        <div className="App" data-layout={layout}>
          <Scene />
          <Dashboard layout={layout} />
          {PREVIEW && <PreviewControls />}
        </div>
      </StateContext>
    </DispatchContext>
  );
}

export default App;
