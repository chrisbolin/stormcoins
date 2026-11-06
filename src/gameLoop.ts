import { useEffect, useReducer } from "react";
import type { Dispatch } from "react";
import {
  FORCE_ENGINE,
  FORCE_GRAVITY,
  COEFFICIENT_DRAG,
  COEFFICIENT_FRICTION,
  PLATFORM_LEFT,
  PLATFORM_WIDTH,
  VEHICLE_WIDTH,
  VEHICLE_HEIGHT,
  VEHICLE_CRASH_VELOCITY,
  VEHICLE_MAX_ALTITUDE,
  VEHICLE_CEILING,
  COIN_WIDTH,
  COIN_HEIGHT,
  VEHICLE_ZERO_VELOCITY,
  CRASH_DURATION,
  DECK_LIFT,
  SCENE_WIDTH,
  SCENE_HEIGHT,
  WIND_VELOCITY_X_INITIAL,
  WIND_VELOCITY_X_INCREMENTAL,
} from "./constants";

// STATE
export interface GameState {
  score: number;
  lastScore: number;
  bestScore: number;
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
  level: number;
  crashedAt: number | null; // timestamp, while the crash animation plays
  crashX: number;
}

export interface PersistedGameState {
  lastScore: number;
  bestScore: number;
}

export const initialGameState: GameState = {
  score: 0,
  lastScore: 0,
  bestScore: 0,
  paused: true,
  engine: false,
  timestamp: 0,
  positionX: 60,
  positionY: 0,
  velocityX: 0,
  velocityY: 0,
  coinVisible: true,
  coinX: 30,
  coinY: 35,
  windVelocityX: WIND_VELOCITY_X_INITIAL,
  level: 1,
  crashedAt: null,
  crashX: 0,
};

export function isOverPlatform(positionX: number): boolean {
  return (
    positionX > PLATFORM_LEFT - VEHICLE_WIDTH / 2 &&
    positionX < PLATFORM_LEFT + PLATFORM_WIDTH - VEHICLE_WIDTH / 2
  );
}

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

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case TICK: {
      const { timestamp } = action;
      let {
        coinVisible,
        score,
        positionX,
        positionY,
        velocityX,
        velocityY,
        coinX,
        coinY,
        windVelocityX,
        level,
      } = state;
      let { engine } = state;
      const dt = timestamp - state.timestamp;

      // crash animation is playing; the scores were recorded when it started
      if (state.crashedAt !== null) {
        return timestamp - state.crashedAt < CRASH_DURATION
          ? { ...state, timestamp }
          : {
              ...initialGameState,
              lastScore: state.lastScore,
              bestScore: state.bestScore,
              timestamp,
            };
      }

      positionX = (positionX + dt * velocityX + SCENE_WIDTH) % SCENE_WIDTH; // wrap x around with (x + width) % width;

      // paused
      if (state.paused) {
        return {
          ...state,
          timestamp,
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
        // keep the whole coin on screen, and above a copter parked on the platform
        coinY =
          VEHICLE_HEIGHT +
          (coinY - VEHICLE_HEIGHT + SCENE_HEIGHT * 0.25) %
            (SCENE_HEIGHT - DECK_LIFT - COIN_HEIGHT - VEHICLE_HEIGHT);
        windVelocityX = windVelocityX + WIND_VELOCITY_X_INCREMENTAL;
        level = level + 1;
      } else if (
        // landing
        !state.engine &&
        state.positionY <= 0 && // allow for 0, as landing sets to 0
        isOverPlatform(state.positionX) &&
        -state.velocityY < VEHICLE_CRASH_VELOCITY
      ) {
        positionY = 0;
        velocityY = 0;
        velocityX = state.velocityX * (1 - COEFFICIENT_FRICTION);
      } else if (state.positionY < 0) {
        // crashed; play the animation before resetting
        return {
          ...state,
          lastScore: score,
          bestScore: score > state.bestScore ? score : state.bestScore,
          engine: false,
          timestamp,
          crashedAt: timestamp,
          crashX: state.positionX,
        };
      } else if (state.positionY > VEHICLE_MAX_ALTITUDE) {
        // flew away; nothing on screen to animate
        return {
          ...initialGameState,
          lastScore: score,
          bestScore: score > state.bestScore ? score : state.bestScore,
          timestamp,
        };
      } else {
        // flying. Past the top of the screen the engine cuts out, and stays off
        // until the player presses again
        if (state.positionY > VEHICLE_CEILING) engine = false;
        const relativeWindVelocityX = windVelocityX - velocityX;
        velocityY =
          state.velocityY +
          (FORCE_ENGINE * Number(engine) - FORCE_GRAVITY) * dt;
        const drag =
          Math.pow(relativeWindVelocityX, 2) *
          Math.sign(relativeWindVelocityX) *
          COEFFICIENT_DRAG *
          dt;
        // strong wind can't push the vehicle past wind speed in one tick. Without
        // this, velocity oscillates and overflows at very high levels
        velocityX =
          state.velocityX +
          (Math.abs(drag) < Math.abs(relativeWindVelocityX)
            ? drag
            : relativeWindVelocityX);
        positionY = state.positionY + dt * state.velocityY;
      }

      if (
        coinVisible &&
        state.positionX - state.coinX < COIN_WIDTH &&
        state.coinX - state.positionX < VEHICLE_WIDTH &&
        state.positionY - state.coinY < COIN_HEIGHT &&
        state.coinY - state.positionY < VEHICLE_HEIGHT
      ) {
        // picked up coin
        coinVisible = false;
        score += 100;
      }

      return {
        ...state,
        engine,
        timestamp,
        positionX,
        positionY,
        velocityX,
        velocityY,
        coinX,
        coinY,
        score,
        coinVisible,
        windVelocityX,
        level,
      };
    }
    case START_ENGINE:
      if (state.crashedAt !== null) return state;
      return { ...state, paused: false, engine: true };
    case STOP_ENGINE:
      return { ...state, engine: false };
    case RESTART:
      return { ...initialGameState, timestamp: state.timestamp };
    default:
      throw new Error(`Invalid action: ${JSON.stringify(action)}`);
  }
}

export function useGameLoop(
  getPersistedGameState: () => PersistedGameState
): [GameState, Dispatch<GameAction>] {
  const [state, dispatch] = useReducer(gameReducer, null, () => ({
    ...initialGameState,
    ...getPersistedGameState(),
  }));

  useEffect(() => {
    let frame = window.requestAnimationFrame(function tick(timestamp) {
      dispatch({ type: TICK, timestamp });
      frame = window.requestAnimationFrame(tick);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return [state, dispatch];
}
