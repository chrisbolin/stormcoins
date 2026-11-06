import { createContext, memo, useContext, useEffect, useState } from "react";
import type { Dispatch } from "react";
import "./App.css";
import {
  initialGameState,
  useGameLoop,
  startEngine,
  stopEngine,
} from "./gameLoop";
import type { GameAction } from "./gameLoop";
import { useTextLayout } from "./textLayout";
import type { TextLayout } from "./textLayout";
import {
  PLATFORM_LEFT,
  PLATFORM_WIDTH,
  VEHICLE_WIDTH,
  VEHICLE_HEIGHT,
  COIN_HEIGHT,
  COIN_WIDTH,
} from "./constants";

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

function Platform() {
  return (
    <div
      className="platform"
      style={{
        left: units(PLATFORM_LEFT),
        width: units(PLATFORM_WIDTH),
      }}
    />
  );
}

function Vehicle() {
  const { positionX, positionY } = useContext(StateContext);
  // render two copters, so that when the player "wraps around" the screen it's fluid
  const bottom = units(positionY);
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
        bottom: units(coinY),
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
      Goal: get coin, land, repeat.
      <br />
      Control: tap, click or spacebar
      <br />
      The wind will push you. Don't land too hard.
    </div>
  );
}

function Dashboard({ layout }: { layout: TextLayout }) {
  const {
    paused,
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
      {paused && <Instructions />}
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

const Scene = memo(function () {
  return (
    <div className="scene">
      <div className="sky">
        <Platform />
        <Coin />
        <Vehicle />
      </div>
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
        </div>
      </StateContext>
    </DispatchContext>
  );
}

export default App;
