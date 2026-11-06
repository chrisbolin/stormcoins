import {
  ART_PIXEL,
  COIN_HEIGHT,
  COIN_WIDTH,
  DECK_LIFT,
} from "./constants";
import { RAIN_CANVAS_HEIGHT, seededRandom } from "./rain";

// A new level arrives with a lightning strike that lands on the new coin. The
// bolt is plotted on the rain canvas's art-pixel grid, so it lines up with the
// rain and sprites. The flash that goes with it hides the sky and rain changing.

const CORE = "#ffffff";
const GLOW = "#ffe98a";
const MAX_SLOPE = 2.2; // columns per row
const BRANCHES = 2;

export interface BoltCell {
  x: number;
  y: number;
  color: string;
}

const clamp = (n: number, limit: number) => Math.max(-limit, Math.min(limit, n));

// the top middle of the coin, in rain-canvas cells (rows count down from the top)
export function coinTarget(coinX: number, coinY: number): { x: number; y: number } {
  return {
    x: Math.round((coinX + COIN_WIDTH / 2) / ART_PIXEL) - 1,
    y: RAIN_CANVAS_HEIGHT - Math.round((coinY + DECK_LIFT + COIN_HEIGHT) / ART_PIXEL),
  };
}

// A jagged line from the top of the sky to the target, in short straight
// segments, plus a couple of forks. The same level always draws the same bolt.
export function boltCells(level: number, target: { x: number; y: number }): BoltCell[] {
  const random = seededRandom(level * 7919 + 17);
  const core: [number, number][] = [];
  const glow: [number, number][] = [];
  const trunk: { x: number; y: number; slope: number }[] = [];

  const plot = (cells: [number, number][], x: number, y: number) => cells.push([x, y]);
  // fills the gap a steep slope leaves between rows, so the line stays connected
  const run = (fromX: number, toX: number, y: number, width: number) => {
    const lo = Math.min(fromX, toX), hi = Math.max(fromX, toX);
    for (let cx = lo; cx <= hi; cx++) {
      for (let w = 0; w < width; w++) plot(core, cx + w, y);
      plot(glow, cx - 1, y);
      plot(glow, cx + width, y);
    }
    if (width > 1) for (let cx = lo; cx <= hi + width - 1; cx++) {
      plot(glow, cx, y - 1);
      plot(glow, cx, y + 1);
    }
  };

  let x = target.x + Math.round((random() * 2 - 1) * target.y * 0.3);
  let y = 0;
  let lastX = x;
  while (y <= target.y) {
    const length = 3 + Math.floor(random() * 6);
    const remaining = Math.max(1, target.y - y);
    const lean = (target.x - x) / remaining;
    // jitter less near the end, so the bolt lands on the coin
    const jitter = remaining > 8 ? (random() * 2 - 1) * 1.4 : 0;
    const slope = clamp(lean + jitter, MAX_SLOPE);
    for (let i = 0; i < length && y <= target.y; i++, y++) {
      x += y === target.y ? target.x - x : slope;
      const cx = Math.round(x);
      run(lastX, cx, y, 2);
      trunk.push({ x: cx, y, slope });
      lastX = cx;
    }
  }

  for (let b = 0; b < BRANCHES && trunk.length > 10; b++) {
    const start = trunk[Math.floor(random() * trunk.length * 0.65)];
    const away = start.slope >= 0 ? -1 : 1;
    let bx = start.x, last = bx;
    const length = 6 + Math.floor(random() * 10);
    for (let i = 1; i <= length; i++) {
      bx += away * (0.8 + random() * 1.2);
      const cx = Math.round(bx);
      run(last, cx, start.y + i, 1);
      last = cx;
    }
  }

  return [
    ...glow.map(([x, y]) => ({ x, y, color: GLOW })),
    ...core.map(([x, y]) => ({ x, y, color: CORE })),
  ];
}

export function drawBolt(context: CanvasRenderingContext2D, cells: BoltCell[]): void {
  for (const { x, y, color } of cells) {
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);
  }
}
