import { expect, test } from "vitest";
import {
  COIN_HEIGHT,
  COIN_WIDTH,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  VEHICLE_HEIGHT,
  VEHICLE_WIDTH,
  WIND_VELOCITY_X_INCREMENTAL,
} from "./constants";
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

test.each([
  ["below", 0, -VEHICLE_HEIGHT],
  ["above", 0, COIN_HEIGHT],
  ["left of", -VEHICLE_WIDTH, 0],
  ["right of", COIN_WIDTH, 0],
])("copter just %s the coin does not collect it", (_side, dx, dy) => {
  const near = 0.01;
  const next = tick({
    ...flying,
    positionX: flying.coinX + dx + Math.sign(dx) * near,
    positionY: flying.coinY + dy + Math.sign(dy) * near,
  });
  expect(next.score).toBe(0);
  expect(next.coinVisible).toBe(true);
});

test.each([
  ["below", 0, -VEHICLE_HEIGHT],
  ["above", 0, COIN_HEIGHT],
  ["left of", -VEHICLE_WIDTH, 0],
  ["right of", COIN_WIDTH, 0],
])("copter barely overlapping from %s collects the coin", (_side, dx, dy) => {
  const near = 0.01;
  const next = tick({
    ...flying,
    positionX: flying.coinX + dx - Math.sign(dx) * near,
    positionY: flying.coinY + dy - Math.sign(dy) * near,
  });
  expect(next.score).toBe(100);
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

test("coins spawn fully on screen and clear of a parked copter", () => {
  let state: GameState = { ...flying, positionX: 60, positionY: 0 };
  for (let i = 0; i < 200; i++) {
    state = tick({ ...state, positionX: 60, positionY: 0, coinVisible: false });
    expect(state.coinVisible).toBe(true);
    expect(state.coinY + COIN_HEIGHT).toBeLessThanOrEqual(SCENE_HEIGHT);
    expect(state.coinX + COIN_WIDTH).toBeLessThanOrEqual(SCENE_WIDTH);
    expect(state.coinY).toBeGreaterThanOrEqual(VEHICLE_HEIGHT);
  }
});

test("coin and wind for a given level don't depend on how it was reached", () => {
  // land after each coin with different timing, position and leftover drift
  const playTo = (level: number, dt: number, positionX: number) => {
    let state = initialGameState;
    for (let i = 1; i < level; i++) {
      const landed = { ...state, paused: false, positionX, positionY: 0 };
      state = tick({ ...landed, coinVisible: false }, dt + i);
    }
    return state;
  };
  const a = playTo(29, 16, 50);
  const b = playTo(29, 7, 68);
  expect([a.coinX, a.coinY, a.windVelocityX]).toEqual([
    b.coinX,
    b.coinY,
    b.windVelocityX,
  ]);
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
