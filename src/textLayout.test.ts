import { expect, test } from "vitest";
import { textLayout } from "./textLayout";

test.each([
  [1440, 800, "side"],
  [2560, 1080, "side"],
  [844, 390, "side"],
  [667, 375, "side"],
  [568, 320, "inside"], // nearly the same shape as 1440 x 800, but its bars are too narrow
  [1024, 768, "inside"],
  [1280, 1024, "inside"],
  [800, 800, "inside"],
  [700, 900, "inside"],
  [768, 1024, "stack"],
  [390, 844, "stack"],
  [390, 664, "stack"],
  [360, 640, "stack"],
])("%i x %i puts text: %s", (width, height, expected) => {
  expect(textLayout(width, height)).toBe(expected);
});

test("thresholds include their exact bar size", () => {
  expect(textLayout(1280, 1000)).toBe("side"); // 140px bars
  expect(textLayout(1279, 1000)).toBe("inside");
  expect(textLayout(760, 1000)).toBe("stack"); // 120px bars
  expect(textLayout(761, 1000)).toBe("inside");
});
