import React, { createContext, memo, useContext } from "react";
import "./App.css";
import { initialGameState, GameAction, useGameLoop } from "./gameLoop";

const DispatchContext = createContext((action: GameAction) => {});
const StateContext = createContext(initialGameState);

function Platform() {
  console.log("<Platform/>");
  return <div className="platform">platform</div>;
}

function Helicopter() {
  const { engine } = useContext(StateContext);
  return (
    <div className="helicopter">
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
      onMouseDown={() => dispatch({ type: "start_engine" })}
      onMouseUp={() => dispatch({ type: "stop_engine" })}
      onTouchStart={() => dispatch({ type: "start_engine" })}
      onTouchEnd={() => dispatch({ type: "stop_engine" })}
    >
      <Helicopter />
      <Platform />
      <TestComponent value="Game child" />
    </div>
  );
});

function TestComponent({ value }: { value: String }) {
  console.log(value);
  return <span />;
}

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
