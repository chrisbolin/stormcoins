import React, {
  createContext,
  memo,
  useContext,
  useEffect,
  Dispatch,
} from "react";
import "./App.css";
import {
  initialGameState,
  GameAction,
  useGameLoop,
  startEngine,
  stopEngine,
} from "./gameLoop";
import {
  PLATFORM_LEFT,
  PLATFORM_WIDTH,
  VEHICLE_WIDTH,
  VEHICLE_HEIGHT,
  COIN_HEIGHT,
  COIN_WIDTH,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from "./constants";

const SPACE_KEY_CODE = 32;

const DispatchContext = createContext((action: GameAction) => {});
const StateContext = createContext(initialGameState);

function addListenerToMultipleEvents(
  types: string[],
  listener: (arg: any) => any
) {
  types.forEach((type) => window.addEventListener(type, listener));
  return () =>
    types.forEach((type) => window.removeEventListener(type, listener));
}

function addGlobalListeners(dispatch: Dispatch<GameAction>) {
  const removeStartListener = addListenerToMultipleEvents(
    ["keydown"],
    (event) => {
      if (event.keyCode === SPACE_KEY_CODE) dispatch(startEngine);
    }
  );
  const removeStopListeners = addListenerToMultipleEvents(
    ["keyup"],
    (event) => {
      if (event.keyCode === SPACE_KEY_CODE) dispatch(stopEngine);
    }
  );

  return () => {
    removeStartListener();
    removeStopListeners();
  };
}

function Platform() {
  return (
    <div
      className="platform"
      style={{
        left: `${PLATFORM_LEFT}vw`,
        width: `${PLATFORM_WIDTH}vw`,
      }}
    >
      platform
    </div>
  );
}

function Vehicle() {
  const { positionX, positionY } = useContext(StateContext);
  // render two copters, so that when the play "wraps around" the screen it's fluid
  const leftA = `${positionX}vw`;
  const leftB = `${positionX - 100}vw`;
  const bottom = `${positionY}vw`;
  const width = `${VEHICLE_WIDTH}vw`;
  const height = `${VEHICLE_HEIGHT}vw`;
  return (
    <>
      <div
        className="vehicle"
        style={{
          left: leftA,
          bottom,
          width,
          height,
        }}
      >
        helicopter
      </div>
      <div
        className="vehicle"
        style={{
          left: leftB,
          bottom,
          width,
          height,
        }}
      >
        helicopter
      </div>
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
        left: `${coinX}vw`,
        bottom: `${coinY}vw`,
        width: `${COIN_WIDTH}vw`,
        height: `${COIN_HEIGHT}vw`,
      }}
    >
      coin
    </div>
  );
}

function Debug() {
  const state = useContext(StateContext);
  if (window.location.port !== "3000") return null;
  return (
    <pre style={{ margin: 0, position: "absolute", bottom: 0, left: 0 }}>
      {JSON.stringify(state, null, 2)}
    </pre>
  );
}

function Instructions() {
  return (
    <h3>
      Goal: get coin, land, repeat.
      <br />
      Control: spacebar [computer] or tap [phone]
      <br />
      The wind will push you. Don't land too hard.
    </h3>
  );
}

function Dashboard() {
  const {
    paused,
    score,
    bestScore,
    lastScore,
    windVelocityX,
    velocityX,
  } = useContext(StateContext);

  return (
    <>
      <h3>
        score: {score}
        <br />
        best: {bestScore}; last: {lastScore}
        <br />
        speed: {Math.round(velocityX * 1000)}
        <br />
        wind speed: {Math.round(windVelocityX * 1000)}
      </h3>
      {paused && <Instructions />}
    </>
  );
}

function ViewportWarning() {
  return (
    <div className="ViewportWarning">
      <h3>Can you make your browser taller? You can't see all of the game.</h3>
    </div>
  );
}

function GamePad() {
  const dispatch = useContext(DispatchContext);
  return (
    <div
      className="GamePad"
      onTouchStart={() => dispatch(startEngine)}
      onTouchEnd={() => dispatch(stopEngine)}
    />
  );
}

const Scene = memo(function () {
  return (
    <div
      className="scene"
      style={{
        height: `${SCENE_HEIGHT}vw`,
        width: `${SCENE_WIDTH}vw`,
      }}
    >
      <Dashboard />
      <Debug />
      <Platform />
      <Coin />
      <Vehicle />
      <ViewportWarning />
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
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>
        <div className="App">
          <Scene />
        </div>
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}

export default App;
