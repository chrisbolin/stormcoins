import React, { useState, useEffect, useCallback, useReducer } from "react";
import "./App.css";
import { initialGameState, gameReducer, GameState } from "./gameState";

function useAnimationFrame() {
  const [timestamp, setTimestamp] = useState(0);
  const tick = useCallback(newTimestamp => {
    setTimestamp(newTimestamp);
    window.requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    window.requestAnimationFrame(tick);
  }, [tick]);

  return timestamp;
}

function Helicopter({ gameState }: { gameState: GameState }) {
  const timestamp = useAnimationFrame();

  return (
    <div className="helicopter">
      helicopter
      <br />
      {gameState.engine ? "ON" : ""}
      <br />
      {timestamp}
    </div>
  );
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  console.log(state);

  return (
    <div
      className="App"
      onMouseDown={() => dispatch({ type: "start_engine" })}
      onMouseUp={() => dispatch({ type: "stop_engine" })}
      onTouchStart={() => dispatch({ type: "start_engine" })}
      onTouchEnd={() => dispatch({ type: "stop_engine" })}
    >
      <div className="game">
        <Helicopter gameState={state} />
        <div className="platform">platform</div>
      </div>
    </div>
  );
}

export default App;
