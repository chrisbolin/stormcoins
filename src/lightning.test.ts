import { expect, test } from "vitest";
import { boltCells, coinTarget } from "./lightning";
import { RAIN_CANVAS_HEIGHT, RAIN_CANVAS_WIDTH } from "./rain";

const cores = (cells: ReturnType<typeof boltCells>) =>
  cells.filter((c) => c.color === "#ffffff");

test("the bolt runs from the top of the sky to the coin, unbroken", () => {
  for (let level = 2; level < 40; level++) {
    const target = coinTarget((level * 37) % 90, 10 + ((level * 13) % 60));
    const core = cores(boltCells(level, target));
    const rows = new Set(core.map((c) => c.y));
    for (let y = 0; y <= target.y; y++) expect(rows.has(y)).toBe(true);
    expect(core.some((c) => c.y === target.y && Math.abs(c.x - target.x) <= 1)).toBe(true);
  }
});

test("the same level always draws the same bolt", () => {
  const target = coinTarget(40, 30);
  expect(boltCells(7, target)).toEqual(boltCells(7, target));
  expect(boltCells(7, target)).not.toEqual(boltCells(8, target));
});

test("the coin target sits inside the rain canvas", () => {
  const { x, y } = coinTarget(0, 0);
  expect(x).toBeGreaterThanOrEqual(0);
  expect(x).toBeLessThan(RAIN_CANVAS_WIDTH);
  expect(y).toBeGreaterThan(0);
  expect(y).toBeLessThan(RAIN_CANVAS_HEIGHT);
});
