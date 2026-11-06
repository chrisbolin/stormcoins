import { expect, test } from "vitest";
import { RAIN_LAYOUT, rainForLevel, streamLeft } from "./rain";

// Pairs of drops side by side on nearly the same slanted line. They keep the same
// spacing as they fall, so a close pair stays a tangle the whole way down.
function countTangles(level: number): number {
  const { streams, tilt } = rainForLevel(level);
  const drops = RAIN_LAYOUT.slice(0, streams).flatMap((stream) =>
    stream.drops.map((drop) => ({
      line: streamLeft(stream.position, tilt) + drop.x,
      phase: drop.phase,
    }))
  );
  let tangles = 0;
  drops.forEach((a, i) => {
    for (const b of drops.slice(i + 1)) {
      const rows = Math.abs(a.phase - b.phase);
      if (Math.abs(a.line - b.line) < 4 && Math.min(rows, 144 - rows) < 10) {
        tangles++;
      }
    }
  });
  return tangles;
}

test("rain has few tangles, even at its heaviest", () => {
  expect(countTangles(1)).toBe(0);
  // purely random placement gives about 150 at level 11 and 250 at level 20
  expect(countTangles(11)).toBeLessThanOrEqual(15);
  expect(countTangles(20)).toBeLessThanOrEqual(30);
});

test("rain gets heavier and more tilted on each of the first 20 levels", () => {
  for (let level = 1; level < 20; level++) {
    const now = rainForLevel(level);
    const next = rainForLevel(level + 1);
    expect(next.streams).toBeGreaterThan(now.streams);
    expect(next.tilt).toBeGreaterThan(now.tilt);
  }
});

test("rain stops building after level 20", () => {
  const level20 = rainForLevel(20);
  expect(rainForLevel(21)).toEqual(level20);
  expect(rainForLevel(10000)).toEqual(level20);
  expect(level20.streams).toBeLessThanOrEqual(RAIN_LAYOUT.length);
  expect(level20.tilt).toBeLessThanOrEqual(1); // still connected stair steps
});

test("rain is split evenly in front of and behind the copter at every level", () => {
  for (const level of [1, 2, 3, 10, 20, 10000]) {
    const streams = RAIN_LAYOUT.slice(0, rainForLevel(level).streams);
    const front = streams.filter((stream) => stream.front).length;
    expect(Math.abs(front - (streams.length - front))).toBeLessThanOrEqual(1);
  }
});

test("rain spacing is uneven but covers the scene at every level", () => {
  for (const level of [1, 10, 10000]) {
    const { streams } = rainForLevel(level);
    const positions = RAIN_LAYOUT.slice(0, streams)
      .map((stream) => stream.position)
      .sort((a, b) => a - b);
    const gaps = positions.slice(1).map((p, i) => p - positions[i]);
    const evenGap = 1 / streams;
    expect(Math.min(...gaps)).toBeLessThan(evenGap * 0.75);
    expect(Math.max(...gaps)).toBeGreaterThan(evenGap * 1.25);
    expect(Math.max(...gaps)).toBeLessThan(evenGap * 4);
  }
});
