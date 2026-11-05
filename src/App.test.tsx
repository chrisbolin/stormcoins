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

test("stops the animation loop on unmount", () => {
  const cancel = vi.spyOn(window, "cancelAnimationFrame");
  const { unmount } = render(<App />);

  unmount();
  expect(cancel).toHaveBeenCalled();
  cancel.mockRestore();
});
