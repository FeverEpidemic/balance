export const MOBILE_NAV_SCROLL_JITTER_PX = 4;
export const MOBILE_NAV_TOP_EXPAND_THRESHOLD_PX = 24;
export const MOBILE_NAV_COLLAPSE_MIN_SCROLL_Y_PX = 96;
export const MOBILE_NAV_COLLAPSE_DISTANCE_PX = 32;
export const MOBILE_NAV_EXPAND_DISTANCE_PX = 16;

export type MobileNavScrollDirection = "up" | "down" | null;

export type MobileNavScrollState = {
  anchorY: number;
  isCompact: boolean;
  lastDirection: MobileNavScrollDirection;
  lastY: number;
};

function clampScrollY(scrollY: number) {
  if (!Number.isFinite(scrollY)) {
    return 0;
  }

  return Math.max(0, scrollY);
}

export function createMobileNavScrollState(scrollY = 0): MobileNavScrollState {
  const nextScrollY = clampScrollY(scrollY);

  return {
    anchorY: nextScrollY,
    isCompact: false,
    lastDirection: null,
    lastY: nextScrollY
  };
}

export function expandMobileNavScrollState(state: MobileNavScrollState, scrollY = state.lastY): MobileNavScrollState {
  const nextScrollY = clampScrollY(scrollY);

  return {
    anchorY: nextScrollY,
    isCompact: false,
    lastDirection: null,
    lastY: nextScrollY
  };
}

export function updateMobileNavScrollState(state: MobileNavScrollState, scrollY: number): MobileNavScrollState {
  const nextScrollY = clampScrollY(scrollY);

  if (nextScrollY <= MOBILE_NAV_TOP_EXPAND_THRESHOLD_PX) {
    return createMobileNavScrollState(nextScrollY);
  }

  const delta = nextScrollY - state.lastY;

  if (Math.abs(delta) < MOBILE_NAV_SCROLL_JITTER_PX) {
    return state;
  }

  const nextDirection: Exclude<MobileNavScrollDirection, null> = delta > 0 ? "down" : "up";
  const anchorY = state.lastDirection === nextDirection ? state.anchorY : state.lastY;
  const distance = Math.abs(nextScrollY - anchorY);

  if (
    !state.isCompact &&
    nextDirection === "down" &&
    nextScrollY > MOBILE_NAV_COLLAPSE_MIN_SCROLL_Y_PX &&
    distance >= MOBILE_NAV_COLLAPSE_DISTANCE_PX
  ) {
    return {
      anchorY: nextScrollY,
      isCompact: true,
      lastDirection: nextDirection,
      lastY: nextScrollY
    };
  }

  if (state.isCompact && nextDirection === "up" && distance >= MOBILE_NAV_EXPAND_DISTANCE_PX) {
    return {
      anchorY: nextScrollY,
      isCompact: false,
      lastDirection: nextDirection,
      lastY: nextScrollY
    };
  }

  return {
    anchorY,
    isCompact: state.isCompact,
    lastDirection: nextDirection,
    lastY: nextScrollY
  };
}
