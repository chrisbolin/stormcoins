import { useEffect, useCallback, useReducer, Dispatch } from "react";

// PHYSICAL CONSTANTS
const FORCE_GRAVITY = 0.001; // note: dt is in milliseconds
const FORCE_ENGINE = 2 * FORCE_GRAVITY;

// STATE
export interface GameState {
  engine: boolean;
  timestamp: number;
  positionX: number;
  positionY: number;
  velocityX: number;
  velocityY: number;
}

export const initialGameState: GameState = {
  engine: false,
  timestamp: 0,
  positionX: 50,
  positionY: 20,
  velocityX: 0,
  velocityY: 0
};

// ACTIONS
const TICK = "tick";
const START_ENGINE = "start_engine";
const STOP_ENGINE = "stop_engine";
const RESTART = "restart";

interface BasicAction {
  type: typeof START_ENGINE | typeof STOP_ENGINE | typeof RESTART;
}

interface TickAction {
  type: typeof TICK;
  timestamp: number;
}

export type GameAction = TickAction | BasicAction;

export const startEngine: GameAction = { type: START_ENGINE };
export const stopEngine: GameAction = { type: STOP_ENGINE };
export const restart: GameAction = { type: RESTART };

export function gameReducer(state: GameState, action: GameAction) {
  switch (action.type) {
    case TICK:
      const dt = action.timestamp - state.timestamp;
      // velocity
      const velocityY =
        state.velocityY +
        (FORCE_ENGINE * Number(state.engine) - FORCE_GRAVITY) * dt;
      // position
      const positionX = state.positionX + state.velocityX;
      const positionY = state.positionY + state.velocityY;
      return {
        ...state,
        timestamp: action.timestamp,
        positionX,
        positionY,
        velocityY
      };
    case START_ENGINE:
      return { ...state, engine: true };
    case STOP_ENGINE:
      return { ...state, engine: false };
    case RESTART:
      return { ...initialGameState, timestamp: state.timestamp };
    default:
      throw new Error(`Invalid action: ${JSON.stringify(action)}`);
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
