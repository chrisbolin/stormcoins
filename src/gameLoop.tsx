import { useEffect, useCallback, useReducer, Dispatch } from "react";

export interface GameState {
  engine: boolean;
  timestamp: number;
}

const TICK = "tick";
const START_ENGINE = "start_engine";
const STOP_ENGINE = "stop_engine";

interface BasicAction {
  type: typeof START_ENGINE | typeof STOP_ENGINE;
}

interface TickAction {
  type: typeof TICK;
  timestamp: number;
}

export type GameAction = TickAction | BasicAction;

export const initialGameState: GameState = {
  engine: false,
  timestamp: 0
};

export function gameReducer(state: GameState, action: GameAction) {
  switch (action.type) {
    case TICK:
      return { ...state, timestamp: action.timestamp };
    case START_ENGINE:
      return { ...state, engine: true };
    case STOP_ENGINE:
      return { ...state, engine: false };
    default:
      throw new Error(`Invalid action: ${action}`);
  }
}

export function useGameLoop(): [GameState, Dispatch<GameAction>] {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const tick = useCallback(newTimestamp => {
    dispatch({ type: "tick", timestamp: newTimestamp });
    window.requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    window.requestAnimationFrame(tick);
  }, [tick]);

  return [state, dispatch];
}
