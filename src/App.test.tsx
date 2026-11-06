import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import App from "./App";

afterEach(cleanup);

test("shows instructions until the spacebar starts the game", () => {
  const { container } = render(<App />);
  expect(container.querySelector(".instructions")).not.toBeNull();

  fireEvent.keyDown(window, { code: "Space" });
  expect(container.querySelector(".instructions")).toBeNull();
});

test("holding the mouse or a finger runs the engine; other buttons don't", () => {
  HTMLElement.prototype.setPointerCapture = vi.fn();
  const { container } = render(<App />);
  const pad = container.querySelector(".GamePad")!;
  const instructions = () => container.querySelector(".instructions");

  fireEvent.pointerDown(pad, { button: 2, pointerId: 1 });
  expect(instructions()).not.toBeNull();

  fireEvent.pointerDown(pad, { button: 0, pointerId: 1 });
  expect(instructions()).toBeNull();
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
