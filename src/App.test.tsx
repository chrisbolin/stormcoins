import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import App from "./App";

afterEach(cleanup);

// jsdom has no canvas, and logs an error when asked for one
beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

// the debug panel shows the game state
function isPaused(container: HTMLElement): boolean {
  if (!container.querySelector("pre")) fireEvent.keyDown(window, { key: "d" });
  return JSON.parse(container.querySelector("pre")!.textContent!).paused;
}

test("spacebar starts the game, and instructions stay on screen", () => {
  const { container } = render(<App />);
  expect(container.querySelector(".instructions")).not.toBeNull();
  expect(isPaused(container)).toBe(true);

  fireEvent.keyDown(window, { code: "Space" });
  expect(isPaused(container)).toBe(false);
  expect(container.querySelector(".instructions")).not.toBeNull();
});

test("sky starts at level 1's color", () => {
  const { container } = render(<App />);
  const sky = container.querySelector<HTMLElement>(".sky")!;
  expect(sky.style.backgroundColor).toBe("rgb(80, 151, 219)");
});

test("holding the mouse or a finger runs the engine; other buttons don't", () => {
  HTMLElement.prototype.setPointerCapture = vi.fn();
  const { container } = render(<App />);
  const pad = container.querySelector(".GamePad")!;

  fireEvent.pointerDown(pad, { button: 2, pointerId: 1 });
  expect(isPaused(container)).toBe(true);

  fireEvent.pointerDown(pad, { button: 0, pointerId: 1 });
  expect(isPaused(container)).toBe(false);
  expect(HTMLElement.prototype.setPointerCapture).toHaveBeenCalled();
  fireEvent.pointerUp(pad, { button: 0, pointerId: 1 });
});

test("debug panel is hidden until d toggles it", () => {
  const { container } = render(<App />);
  expect(container.querySelector("pre")).toBeNull();

  fireEvent.keyDown(window, { key: "d" });
  expect(container.querySelector("pre")).not.toBeNull();

  fireEvent.keyDown(window, { key: "d", repeat: true });
  expect(container.querySelector("pre")).not.toBeNull();

  fireEvent.keyDown(window, { key: "d" });
  expect(container.querySelector("pre")).toBeNull();
});

test("moves text to match the window, keeping stats on one line each in side bars", () => {
  const resize = (width: number, height: number) => {
    window.innerWidth = width;
    window.innerHeight = height;
    fireEvent(window, new Event("resize"));
  };
  resize(1440, 800);
  const { container } = render(<App />);
  const app = container.querySelector(".App")!;
  const statLines = () => container.querySelectorAll(".hud > div").length;
  expect(app.getAttribute("data-layout")).toBe("side");
  expect(statLines()).toBe(5);

  resize(390, 844);
  expect(app.getAttribute("data-layout")).toBe("stack");
  expect(statLines()).toBe(3);

  resize(800, 800);
  expect(app.getAttribute("data-layout")).toBe("inside");
  expect(statLines()).toBe(3);
});

test("stops the animation loop on unmount", () => {
  const cancel = vi.spyOn(window, "cancelAnimationFrame");
  const { unmount } = render(<App />);

  unmount();
  expect(cancel).toHaveBeenCalled();
  cancel.mockRestore();
});
