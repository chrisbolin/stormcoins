import { useSyncExternalStore } from "react";

export type TextLayout = "side" | "stack" | "inside";

// Smallest black bars that can hold the text. Side bars need the width of the
// widest stats line; top and bottom bars can use the screen's full width.
const SIDE_BAR_MIN = 140;
const STACK_BAR_MIN = 120;

export function textLayout(width: number, height: number): TextLayout {
  const bar = Math.abs(width - height) / 2;
  if (width > height && bar >= SIDE_BAR_MIN) return "side";
  if (height > width && bar >= STACK_BAR_MIN) return "stack";
  return "inside";
}

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

export function useTextLayout(): TextLayout {
  return useSyncExternalStore(subscribe, () =>
    textLayout(window.innerWidth, window.innerHeight)
  );
}
