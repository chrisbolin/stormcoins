import { useEffect, useCallback, useReducer, Dispatch } from "react";
import {
  FORCE_ENGINE,
  FORCE_GRAVITY,
  COEFFICIENT_DRAG,
  COEFFICIENT_FRICTION,
  PLATFORM_LEFT,
  PLATFORM_WIDTH,
  VEHICLE_WIDTH,
  VEHICLE_CRASH_VELOCITY,
  VEHICLE_MAX_ALTITUDE,
  COIN_WIDTH,
  COIN_HEIGHT,
  VEHICLE_ZERO_VELOCITY,
  SCENE_WIDTH,
  SCENE_HEIGHT,
  WIND_VELOCITY_X_INITIAL,
  WIND_VELOCITY_X_INCREMENTAL
} from "./constants";

// STATE
export interface GameState {
  score: number;
  paused: boolean;
  engine: boolean;
  timestamp: number;
  positionX: number;
  positionY: number;
  velocityX: number;
  velocityY: number;
  coinVisible: boolean;
  coinX: number;
  coinY: number;
  windVelocityX: number;
}

export const initialGameState: GameState = {
  score: 0,
  paused: true,
  engine: false,
  timestamp: 0,
  positionX: 50,
  positionY: 30,
  velocityX: 0,
  velocityY: 0,
  coinVisible: true,
  coinX: 30,
  coinY: 35,
  windVelocityX: WIND_VELOCITY_X_INITIAL
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
      let {
        coinVisible,
        score,
        positionX,
        positionY,
        velocityX,
        velocityY,
        coinX,
        coinY,
        windVelocityX
      } = state;
      const dt = action.timestamp - state.timestamp;

      positionX = (positionX + dt * velocityX + SCENE_WIDTH) % SCENE_WIDTH; // wrap x around with (x + width) % width;

      // paused
      if (state.paused) {
        return {
          ...state,
          timestamp: action.timestamp
        };
      } else if (
        // completely landed after getting coin
        !state.coinVisible &&
        state.positionY === 0 &&
        Math.abs(state.velocityX) < VEHICLE_ZERO_VELOCITY
      ) {
        coinVisible = true;
        velocityX = 0;
        coinX = (coinX + SCENE_WIDTH * 0.7) % (SCENE_WIDTH * 0.9);
        coinY = (coinY + SCENE_HEIGHT * 0.25) % (SCENE_HEIGHT * 0.9);
        windVelocityX = windVelocityX + WIND_VELOCITY_X_INCREMENTAL;
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
      } else if (
        state.positionY < 0 ||
        state.positionY > VEHICLE_MAX_ALTITUDE
      ) {
        // crashed
        return {
          ...initialGameState
        };
      } else {
        // flying
        const relativeWindVelocityX = windVelocityX - velocityX;
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

      if (
        coinVisible &&
        state.positionX - state.coinX < COIN_WIDTH &&
        state.coinX - state.positionX < VEHICLE_WIDTH &&
        state.positionY - state.coinY < COIN_HEIGHT &&
        state.coinY - state.positionY < COIN_WIDTH
      ) {
        // picked up coin
        coinVisible = false;
        score += 100;
      }

      return {
        ...state,
        timestamp: action.timestamp,
        positionX,
        positionY,
        velocityX,
        velocityY,
        coinX,
        coinY,
        score,
        coinVisible,
        windVelocityX
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
