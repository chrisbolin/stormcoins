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
  restart,
  startEngine,
  stopEngine
} from "./gameLoop";
import {
  PLATFORM_LEFT,
  PLATFORM_WIDTH,
  VEHICLE_WIDTH,
  VEHICLE_HEIGHT,
  COIN_HEIGHT,
  COIN_WIDTH
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
    />
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
    />
  );
}

function Coin() {
  const { coinX, coinY } = useContext(StateContext);
  return (
    <div
      className="coin"
      style={{
        left: `${coinX}vw`,
        bottom: `${coinY}vw`,
        width: `${COIN_WIDTH}vw`,
        height: `${COIN_HEIGHT}vw`
      }}
    />
  );
}

function Debug() {
  const state = useContext(StateContext);
  return <pre style={{ margin: 0 }}>{JSON.stringify(state, null, 2)}</pre>;
}

const Game = memo(function() {
  const dispatch = useContext(DispatchContext);

  useEffect(() => {
    const removeGlobalListeners = addGlobalListeners(dispatch);
    return removeGlobalListeners;
  }, [dispatch]);

  return (
    <div className="game">
      <button onClick={() => dispatch(restart)}>restart</button>
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
          <Game />
        </div>
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}

export default App;
