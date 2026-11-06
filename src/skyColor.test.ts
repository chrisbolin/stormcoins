import { expect, test } from "vitest";
import { hexToOklab, oklabToHex, skyColor } from "./skyColor";

const distance = (a: string, b: string) => {
  const [p, q] = [hexToOklab(a), hexToOklab(b)];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
};

test("OKLab conversion matches published reference values", () => {
  const white = hexToOklab("#ffffff");
  expect(white[0]).toBeCloseTo(1, 3);
  expect(white[1]).toBeCloseTo(0, 3);
  expect(white[2]).toBeCloseTo(0, 3);

  const red = hexToOklab("#ff0000");
  expect(red[0]).toBeCloseTo(0.628, 3);
  expect(red[1]).toBeCloseTo(0.2249, 3);
  expect(red[2]).toBeCloseTo(0.1258, 3);

  for (const color of ["#3b82c4", "#123456", "#ffd249"]) {
    expect(oklabToHex(hexToOklab(color))).toBe(color);
  }
});

test("sky goes from light blue to dark blue at level 10, then holds", () => {
  expect(skyColor(1)).toBe("#5097db");
  expect(skyColor(9)).not.toBe("#11304c");
  expect(skyColor(10)).toBe("#11304c");
  expect(skyColor(11)).toBe("#11304c");
  expect(skyColor(10000)).toBe("#11304c");
});

test("the darkest sky is still clearly different from black", () => {
  const step = distance(skyColor(1), skyColor(2));
  expect(distance(skyColor(10), "#000000")).toBeGreaterThan(step * 4);
});

test("every sky step from level 1 to 10 looks the same size", () => {
  const steps = Array.from({ length: 9 }, (_, i) =>
    distance(skyColor(i + 1), skyColor(i + 2))
  );
  const average = steps.reduce((sum, step) => sum + step) / steps.length;
  for (const step of steps) {
    // colors are rounded to 8 bits, so allow for that much
    expect(Math.abs(step - average)).toBeLessThan(0.006);
  }
});
