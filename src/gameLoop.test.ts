import { expect, test } from "vitest";
import {
  COIN_HEIGHT,
  COIN_WIDTH,
  CRASH_DURATION,
  DECK_LIFT,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  VEHICLE_CEILING,
  VEHICLE_HEIGHT,
  VEHICLE_WIDTH,
  WIND_VELOCITY_X_INCREMENTAL,
} from "./constants";
import {
  gameReducer,
  initialGameState,
  nextLevel,
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

test("wind keeps rising past level 20, and stays stable at level 10000", () => {
  const landed = {
    ...flying,
    positionX: 60,
    positionY: 0,
    coinVisible: false,
    level: 25,
  };
  expect(tick(landed).windVelocityX).toBeCloseTo(
    landed.windVelocityX + WIND_VELOCITY_X_INCREMENTAL
  );

  const windVelocityX =
    initialGameState.windVelocityX + 9999 * WIND_VELOCITY_X_INCREMENTAL;
  let state: GameState = { ...flying, windVelocityX, coinVisible: false };
  for (let i = 0; i < 60; i++) {
    state = tick({ ...state, positionY: 20, velocityY: 0 });
    expect(state.velocityX).toBeLessThanOrEqual(windVelocityX);
    expect(state.positionX).toBeGreaterThanOrEqual(0);
    expect(state.positionX).toBeLessThan(SCENE_WIDTH);
  }
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
  expect(next.level).toBe(flying.level + 1);
});

test("coins spawn fully on screen and clear of a parked copter", () => {
  let state: GameState = { ...flying, positionX: 60, positionY: 0 };
  for (let i = 0; i < 200; i++) {
    state = tick({ ...state, positionX: 60, positionY: 0, coinVisible: false });
    expect(state.coinVisible).toBe(true);
    expect(state.coinY + DECK_LIFT + COIN_HEIGHT).toBeLessThanOrEqual(SCENE_HEIGHT);
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

test("landing too hard crashes, plays the animation, then resets", () => {
  const crashed = tick({
    ...flying,
    positionX: 60,
    positionY: -0.1,
    velocityY: -1,
    score: 300,
    bestScore: 200,
    engine: true,
  });
  expect(crashed.crashedAt).toBe(crashed.timestamp);
  expect(crashed.crashX).toBe(60);
  expect(crashed.engine).toBe(false);
  expect(crashed.lastScore).toBe(300);
  expect(crashed.bestScore).toBe(300);

  // input and physics wait for the animation
  expect(gameReducer(crashed, startEngine)).toBe(crashed);
  const playing = tick(crashed, CRASH_DURATION - 1);
  expect(playing.positionY).toBe(crashed.positionY);
  expect(playing.crashedAt).toBe(crashed.crashedAt);

  const reset = tick(playing, 1);
  expect(reset.crashedAt).toBeNull();
  expect(reset.level).toBe(1);
  expect(reset.paused).toBe(true);
  expect(reset.score).toBe(0);
  expect(reset.lastScore).toBe(300);
  expect(reset.bestScore).toBe(300);
});

test("level only changes after landing with the coin", () => {
  const start = { ...flying, level: 7 };
  expect(tick(start).level).toBe(7); // flying
  expect(tick({ ...start, coinVisible: false }).level).toBe(7); // got coin, still airborne
  const onPad = { ...start, positionX: 60, positionY: 0 };
  expect(tick(onPad).level).toBe(7); // landed, but no coin yet
  expect(tick({ ...onPad, coinVisible: false }).level).toBe(8);
});

test("flying away resets without a crash animation", () => {
  const next = tick({ ...flying, positionY: 1001, score: 100 });
  expect(next.crashedAt).toBeNull();
  expect(next.paused).toBe(true);
  expect(next.lastScore).toBe(100);
});

test("the engine gives no thrust above the top of the screen, and resumes back in frame", () => {
  const high = tick({ ...flying, engine: true, positionY: VEHICLE_CEILING + 1 });
  expect(high.velocityY).toBeLessThan(0);
  expect(high.engine).toBe(true); // still pressing
  const back = tick({ ...high, positionY: VEHICLE_CEILING - 1, velocityY: 0 });
  expect(back.velocityY).toBeGreaterThan(0);
});

test("skipping a level matches landing with the coin", () => {
  const landed = { ...flying, positionX: 60, positionY: 0, coinVisible: false };
  const skipped = gameReducer(landed, nextLevel);
  const earned = tick(landed);
  for (const key of ["level", "coinX", "coinY", "windVelocityX", "coinVisible"] as const) {
    expect(skipped[key]).toEqual(earned[key]);
  }
});
