import { useEffect, useCallback, useReducer, Dispatch } from "react";
import {
  FORCE_ENGINE,
  FORCE_GRAVITY,
  COEFFICIENT_DRAG,
  COEFFICIENT_FRICTION,
  PLATFORM_LEFT,
  PLATFORM_WIDTH,
  VEHICLE_WIDTH,
  VEHICLE_CRASH_VELOCITY
} from "./constants";

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
  windVelocityX: 0.09
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
      const relativeWindVelocityX = state.windVelocityX - state.velocityX;

      const positionX = (state.positionX + dt * state.velocityX + 100) % 100; // wrap x around with (x + 100) % 100;
      let positionY = 0;
      let velocityX = 0;
      let velocityY = 0;

      // paused
      if (state.paused) {
        return {
          ...state,
          timestamp: action.timestamp
        };
      } else if (
        // landing
        !state.engine &&
        state.positionY <= 0 && // allow for 0, as landing sets to 0
        state.positionX > PLATFORM_LEFT - VEHICLE_WIDTH / 2 &&
        state.positionX < PLATFORM_LEFT + PLATFORM_WIDTH - VEHICLE_WIDTH / 2 &&
        -state.velocityY < VEHICLE_CRASH_VELOCITY
      ) {
        positionY = 0;
        velocityY = 0;
        velocityX = state.velocityX * (1 - COEFFICIENT_FRICTION);
      } else if (state.positionY < 0) {
        // crashed
        return {
          ...initialGameState
        };
      } else {
        // flying
        velocityY =
          state.velocityY +
          (FORCE_ENGINE * Number(state.engine) - FORCE_GRAVITY) * dt;
        velocityX =
          state.velocityX +
          Math.pow(relativeWindVelocityX, 2) *
            Math.sign(relativeWindVelocityX) *
            COEFFICIENT_DRAG *
            dt;
        positionY = state.positionY + dt * state.velocityY;
      }

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
