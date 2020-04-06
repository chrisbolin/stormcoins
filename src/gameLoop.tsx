import { useEffect, useCallback, useReducer, Dispatch } from "react";

export interface GameState {
  engine: boolean;
  timestamp: number;
  vehicleX: number;
  vehicleY: number;
}

export const initialGameState: GameState = {
  engine: false,
  timestamp: 0,
  vehicleX: 50,
  vehicleY: 20
};

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

export function gameReducer(state: GameState, action: GameAction) {
  switch (action.type) {
    case TICK:
      const vehicleY = state.vehicleY + (state.engine ? 1 : -1);
      return { ...state, timestamp: action.timestamp, vehicleY };
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
    dispatch({ type: TICK, timestamp: newTimestamp });
    window.requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    window.requestAnimationFrame(tick);
  }, [tick]);

  return [state, dispatch];
}
