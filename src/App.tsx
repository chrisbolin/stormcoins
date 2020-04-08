import React, { createContext, memo, useContext } from "react";
import "./App.css";
import {
  initialGameState,
  GameAction,
  useGameLoop,
  startEngine,
  stopEngine,
  restart
} from "./gameLoop";

const DispatchContext = createContext((action: GameAction) => {});
const StateContext = createContext(initialGameState);

function Platform() {
  return <div className="platform"></div>;
}

function Vehicle() {
  const { positionX, positionY } = useContext(StateContext);
  return (
    <div
      className="vehicle"
      style={{ left: `${positionX}vw`, bottom: `${positionY}vw` }}
    ></div>
  );
}

function Debug() {
  const state = useContext(StateContext);
  return <pre style={{ margin: 0 }}>{JSON.stringify(state, null, 2)}</pre>;
}

const Game = memo(function() {
  const dispatch = useContext(DispatchContext);
  return (
    <div className="game">
      <Debug />
      <Vehicle />
      <Platform />
      <button onClick={() => dispatch(restart)}>restart</button>
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
