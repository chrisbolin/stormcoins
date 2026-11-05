import { expect, test } from "vitest";
import { WIND_VELOCITY_X_INCREMENTAL } from "./constants";
import {
  gameReducer,
  initialGameState,
  startEngine,
  stopEngine,
} from "./gameLoop";
import type { GameState } from "./gameLoop";

const flying: GameState = {
  ...initialGameState,
  paused: false,
  positionX: 10,
  positionY: 20,
};
const tick = (state: GameState, dt = 16) =>
  gameReducer(state, { type: "tick", timestamp: state.timestamp + dt });

test("paused game only advances the clock", () => {
  expect(tick(initialGameState)).toEqual({
    ...initialGameState,
    timestamp: 16,
  });
});

test("engine unpauses, and thrust beats gravity", () => {
  const started = gameReducer(initialGameState, startEngine);
  expect(started.paused).toBe(false);
  expect(tick({ ...flying, engine: true }).velocityY).toBeGreaterThan(0);
  expect(tick(gameReducer(flying, stopEngine)).velocityY).toBeLessThan(0);
});

test("wind pushes the vehicle sideways", () => {
  expect(tick(flying).velocityX).toBeGreaterThan(0);
});

test("touching the coin scores and hides it", () => {
  const next = tick({
    ...flying,
    positionX: flying.coinX,
    positionY: flying.coinY,
  });
  expect(next.score).toBe(100);
  expect(next.coinVisible).toBe(false);
});

test("stopping on the platform after a coin spawns a new one and adds wind", () => {
  const next = tick({
    ...flying,
    positionX: 60,
    positionY: 0,
    coinVisible: false,
  });
  expect(next.coinVisible).toBe(true);
  expect(next.coinX).not.toBe(flying.coinX);
  expect(next.windVelocityX).toBeCloseTo(
    flying.windVelocityX + WIND_VELOCITY_X_INCREMENTAL
  );
});

test("landing softly on the platform is safe", () => {
  const next = tick({ ...flying, positionX: 60, positionY: -0.1, velocityY: -0.01 });
  expect(next.paused).toBe(false);
  expect(next.positionY).toBe(0);
  expect(next.velocityY).toBe(0);
});

test("landing too hard crashes and records the score", () => {
  const next = tick({
    ...flying,
    positionX: 60,
    positionY: -0.1,
    velocityY: -1,
    score: 300,
    bestScore: 200,
  });
  expect(next.paused).toBe(true);
  expect(next.score).toBe(0);
  expect(next.lastScore).toBe(300);
  expect(next.bestScore).toBe(300);
});
