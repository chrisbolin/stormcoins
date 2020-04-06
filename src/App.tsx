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
  console.log("<Platform/>");
  return <div className="platform">platform</div>;
}

function Vehicle() {
  const { engine, positionX, positionY } = useContext(StateContext);
  return (
    <div
      className="vehicle"
      style={{ left: `${positionX}vw`, bottom: `${positionY}vw` }}
    >
      helicopter
      <br />
      {engine ? "ON" : ""}
      <br />
    </div>
  );
}

const Game = memo(function() {
  const dispatch = useContext(DispatchContext);
  return (
    <div
      className="game"
      onMouseDown={() => dispatch(startEngine)}
      onMouseUp={() => dispatch(stopEngine)}
      onTouchStart={() => dispatch(startEngine)}
      onTouchEnd={() => dispatch(stopEngine)}
    >
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
