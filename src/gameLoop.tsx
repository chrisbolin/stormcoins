import { useEffect, useCallback, useReducer, Dispatch } from "react";

// PHYSICAL CONSTANTS
const FORCE_GRAVITY = 4.5 / 100000; // note: dt is in milliseconds, so this constant needs to be very small
const FORCE_ENGINE = 2.5 * FORCE_GRAVITY;
const DRAG_COEFFICIENT = 1 / 100;

// STATE
export interface GameState {
  paused: boolean;
  engine: boolean;
  timestamp: number;
  positionX: number;
  positionY: number;
  velocityX: number;
  velocityY: number;
  windVelocityX: number;
}

export const initialGameState: GameState = {
  paused: true,
  engine: false,
  timestamp: 0,
  positionX: 50,
  positionY: 30,
  velocityX: 0,
  velocityY: 0,
  windVelocityX: 0.08
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
      if (state.paused) {
        return {
          ...state,
          timestamp: action.timestamp
        };
      }

      const dt = action.timestamp - state.timestamp;
      // velocity
      const velocityY =
        state.velocityY +
        (FORCE_ENGINE * Number(state.engine) - FORCE_GRAVITY) * dt;

      const relativeWindVelocityX = state.windVelocityX - state.velocityX;
      const velocityX =
        state.velocityX +
        Math.pow(relativeWindVelocityX, 2) *
          Math.sign(relativeWindVelocityX) *
          DRAG_COEFFICIENT *
          dt;
      // position
      const positionX = (state.positionX + dt * state.velocityX + 100) % 100; // wrap x around with (x + 100) % 100
      const positionY = state.positionY + dt * state.velocityY;
      return {
        ...state,
        timestamp: action.timestamp,
        positionX,
        positionY,
        velocityX,
        velocityY
      };
    case START_ENGINE:
      return { ...state, paused: false, engine: true };
    case STOP_ENGINE:
      return { ...state, engine: false };
    case RESTART:
      return { ...initialGameState };
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
