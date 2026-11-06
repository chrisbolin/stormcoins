import { ART_PIXEL, SCENE_HEIGHT, SCENE_WIDTH } from "./constants";

// Rain is drawn on the same art-pixel grid as the sprites. Its tilt changes per
// level, and a tilted line can't be stretched from one sprite without leaving
// the grid, so each pixel is plotted instead.
export const RAIN_CANVAS_WIDTH = Math.ceil(SCENE_WIDTH / ART_PIXEL);
export const RAIN_CANVAS_HEIGHT = Math.ceil(SCENE_HEIGHT / ART_PIXEL);
export const RAIN_FRAME_DURATION = 50; // milliseconds, same as the copter's rotor

const ROWS_PER_FRAME = 8;
const LOOP_ROWS = 144; // a stream's drops repeat after this many rows
const DROPS_PER_LOOP = 9;
const STREAM_WIDTH = 7;
// two drops closer than this, on both counts, look like one tangled patch
const TANGLE_COLUMNS = 4;
const TANGLE_ROWS = 10;
const PLACEMENT_ATTEMPTS = 24;

// Rain builds evenly up to this level and then stops, so it stays readable at
// any level, however high.
const LAST_RAMP_LEVEL = 20;
const STREAMS_AT_LEVEL_1 = 22;
const STREAMS_LIMIT = 60; // 2 more per level
const TILT_AT_LEVEL_1 = 0.25; // columns moved per row fallen
const TILT_LIMIT = 0.9;

const LIGHT = "#d6eefb";
const MID = "#9fd0ef";
const DIM = "#6fadde";

interface Drop {
  x: number;
  phase: number;
  tailRows: number;
  headRows: number;
  tailColor: string;
  headColor: string;
}

export interface RainStream {
  position: number; // 0 to 1, across the scene
  drops: Drop[];
  front: boolean;
}

export interface RainLevel {
  streams: number;
  tilt: number;
}

export function rainForLevel(level: number): RainLevel {
  const ramp = Math.min(1, (level - 1) / (LAST_RAMP_LEVEL - 1));
  return {
    streams: Math.round(
      STREAMS_AT_LEVEL_1 + (STREAMS_LIMIT - STREAMS_AT_LEVEL_1) * ramp
    ),
    tilt: TILT_AT_LEVEL_1 + (TILT_LIMIT - TILT_AT_LEVEL_1) * ramp,
  };
}

// mulberry32. Seeded so the layout is the same on every load and render.
export function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PlacedDrop {
  position: number;
  x: number;
  phase: number;
}

// Drops all fall at the same speed, so two drops side by side stay that way the
// whole way down. This measures how close two are. Below 1, they read as a tangle.
function closeness(a: PlacedDrop, b: PlacedDrop, tilt: number): number {
  const columns =
    streamLeft(a.position, tilt) + a.x - streamLeft(b.position, tilt) - b.x;
  const apart = Math.abs(a.phase - b.phase);
  const rows = Math.min(apart, LOOP_ROWS - apart);
  return Math.max(Math.abs(columns) / TANGLE_COLUMNS, rows / TANGLE_ROWS);
}

// Each drop tries random spots along its stream until one is clear of every drop
// placed so far. Each stream's drops are its own, so the sky doesn't show the same
// clusters over and over.
function layoutDrops(
  random: () => number,
  position: number,
  tilts: number[],
  placed: PlacedDrop[]
): Drop[] {
  return Array.from({ length: DROPS_PER_LOOP }, () => {
    let best: PlacedDrop = { position, x: 0, phase: 0 };
    let bestRoom = -1;
    for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS && bestRoom < 1; attempt++) {
      const candidate = {
        position,
        x: Math.floor(random() * STREAM_WIDTH),
        phase: Math.floor(random() * LOOP_ROWS),
      };
      let room = Infinity;
      for (const other of placed) {
        for (const tilt of tilts) {
          room = Math.min(room, closeness(candidate, other, tilt));
        }
      }
      if (room > bestRoom) {
        best = candidate;
        bestRoom = room;
      }
    }
    placed.push(best);
    const faint = random() < 1 / 3;
    const rows = (faint ? 4 : 7) + Math.floor(random() * 2);
    return {
      x: best.x,
      phase: best.phase,
      tailRows: rows - (rows >> 1),
      headRows: rows >> 1,
      tailColor: faint ? DIM : MID,
      headColor: faint ? MID : LIGHT,
    };
  });
}

// the level a stream first appears on
function streamLevel(index: number): number {
  return 1 + Math.max(0, Math.ceil((index + 1 - STREAMS_AT_LEVEL_1) / 2));
}

// Each new stream takes the roomiest of a few random spots. Any count of streams
// from the start of this list is spread out but uneven, so each level only adds
// rain. Streams alternate in front of and behind the copter, so any count splits
// in half. Tilt changes how far apart streams sit, so drops are kept clear at every
// tilt from the one a stream first appears with through the final one.
function layoutRain(): RainStream[] {
  const random = seededRandom(20261105);
  const positions: number[] = [];
  const placed: PlacedDrop[] = [];
  return Array.from({ length: STREAMS_LIMIT }, (_, i) => {
    let position = random();
    let room = -1;
    for (let candidate = 0; candidate < 3; candidate++) {
      const spot = random();
      const spotRoom = Math.min(1, ...positions.map((p) => Math.abs(p - spot)));
      if (spotRoom > room) {
        position = spot;
        room = spotRoom;
      }
    }
    positions.push(position);
    const firstTilt = rainForLevel(streamLevel(i)).tilt;
    const tilts = [0, 1 / 3, 2 / 3, 1].map(
      (step) => firstTilt + (TILT_LIMIT - firstTilt) * step
    );
    return {
      position,
      drops: layoutDrops(random, position, tilts, placed),
      front: i % 2 === 1,
    };
  });
}

export const RAIN_LAYOUT = layoutRain();

// Streams lean right as they fall, so they start far enough off the left edge to
// reach the bottom-left corner.
export function streamLeft(position: number, tilt: number): number {
  const drift = RAIN_CANVAS_HEIGHT * tilt + STREAM_WIDTH;
  return position * (RAIN_CANVAS_WIDTH + drift) - drift;
}

export function drawRain(
  context: CanvasRenderingContext2D,
  { streams, tilt }: RainLevel,
  frame: number,
  front: boolean
): void {
  context.clearRect(0, 0, RAIN_CANVAS_WIDTH, RAIN_CANVAS_HEIGHT);
  for (let i = 0; i < streams; i++) {
    const stream = RAIN_LAYOUT[i];
    if (stream.front !== front) continue;
    const left = streamLeft(stream.position, tilt);
    for (const drop of stream.drops) {
      const rows = drop.tailRows + drop.headRows;
      const start = (drop.phase + frame * ROWS_PER_FRAME) % LOOP_ROWS;
      for (let top = start - LOOP_ROWS; top < RAIN_CANVAS_HEIGHT; top += LOOP_ROWS) {
        for (let j = 0; j < rows; j++) {
          const row = top + j;
          if (row < 0 || row >= RAIN_CANVAS_HEIGHT) continue;
          context.fillStyle = j < drop.tailRows ? drop.tailColor : drop.headColor;
          context.fillRect(Math.floor(left + drop.x + row * tilt), row, 1, 1);
        }
      }
    }
  }
}
