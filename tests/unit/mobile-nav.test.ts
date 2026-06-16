import { describe, expect, it } from "vitest";
import {
  createMobileNavScrollState,
  expandMobileNavScrollState,
  updateMobileNavScrollState
} from "@/lib/mobile-nav";

describe("mobile nav scroll state", () => {
  it("stays expanded near the top of the page", () => {
    const initialState = createMobileNavScrollState(12);
    const nextState = updateMobileNavScrollState(initialState, 20);

    expect(nextState.isCompact).toBe(false);
    expect(nextState.lastY).toBe(20);
    expect(nextState.lastDirection).toBeNull();
  });

  it("collapses after a sustained downward scroll beyond the threshold", () => {
    let state = createMobileNavScrollState(40);

    state = updateMobileNavScrollState(state, 72);
    state = updateMobileNavScrollState(state, 104);

    expect(state.isCompact).toBe(true);
    expect(state.lastDirection).toBe("down");
    expect(state.lastY).toBe(104);
  });

  it("ignores jitter smaller than the configured delta", () => {
    const initialState = createMobileNavScrollState(120);
    const nextState = updateMobileNavScrollState(initialState, 123);

    expect(nextState).toEqual(initialState);
  });

  it("expands again after a sustained upward scroll", () => {
    let state = createMobileNavScrollState(48);

    state = updateMobileNavScrollState(state, 82);
    state = updateMobileNavScrollState(state, 120);
    state = updateMobileNavScrollState(state, 108);
    state = updateMobileNavScrollState(state, 92);

    expect(state.isCompact).toBe(false);
    expect(state.lastDirection).toBe("up");
    expect(state.lastY).toBe(92);
  });

  it("resets to expanded state for interaction or route changes", () => {
    let state = createMobileNavScrollState(48);

    state = updateMobileNavScrollState(state, 82);
    state = updateMobileNavScrollState(state, 120);

    const nextState = expandMobileNavScrollState(state, 120);

    expect(nextState.isCompact).toBe(false);
    expect(nextState.lastDirection).toBeNull();
    expect(nextState.anchorY).toBe(120);
    expect(nextState.lastY).toBe(120);
  });
});
