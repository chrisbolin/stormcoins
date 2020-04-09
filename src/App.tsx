import React, {
  createContext,
  memo,
  useContext,
  useEffect,
  Dispatch
} from "react";
import "./App.css";
import {
  initialGameState,
  GameAction,
  useGameLoop,
  startEngine,
  stopEngine
} from "./gameLoop";
import {
  PLATFORM_LEFT,
  PLATFORM_WIDTH,
  VEHICLE_WIDTH,
  VEHICLE_HEIGHT,
  COIN_HEIGHT,
  COIN_WIDTH,
  SCENE_HEIGHT,
  SCENE_WIDTH
} from "./constants";

const DispatchContext = createContext((action: GameAction) => {});
const StateContext = createContext(initialGameState);

function addListenerToMultipleEvents(types: string[], listener: () => any) {
  types.forEach(type => window.addEventListener(type, listener));
  return () =>
    types.forEach(type => window.removeEventListener(type, listener));
}

function addGlobalListeners(dispatch: Dispatch<GameAction>) {
  const removeStartListener = addListenerToMultipleEvents(
    ["mousedown", "keydown", "touchstart"],
    () => dispatch(startEngine)
  );
  const removeStopListeners = addListenerToMultipleEvents(
    ["mouseup", "keyup", "touchend"],
    () => dispatch(stopEngine)
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
        width: `${PLATFORM_WIDTH}vw`
      }}
    >
      platform
    </div>
  );
}

function Vehicle() {
  const { positionX, positionY } = useContext(StateContext);
  return (
    <div
      className="vehicle"
      style={{
        left: `${positionX}vw`,
        bottom: `${positionY}vw`,
        width: `${VEHICLE_WIDTH}vw`,
        height: `${VEHICLE_HEIGHT}vw`
      }}
    >
      helicopter
    </div>
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
        height: `${COIN_HEIGHT}vw`
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
      Engine: any key, click, or touch anywhere.
      <br />
      There are no other controls.
      <br />
      The wind will push you, like it or not.
      <br />
      Don't land too hard pls.
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
    velocityX
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

const Scene = memo(function() {
  const dispatch = useContext(DispatchContext);

  useEffect(() => {
    const removeGlobalListeners = addGlobalListeners(dispatch);
    return removeGlobalListeners;
  }, [dispatch]);

  return (
    <div
      className="scene"
      style={{
        height: `${SCENE_HEIGHT}vw`,
        width: `${SCENE_WIDTH}vw`
      }}
    >
      <Dashboard />
      <Debug />
      <Platform />
      <Coin />
      <Vehicle />
    </div>
  );
});

function App() {
  const [state, dispatch] = useGameLoop();

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
