"use client";

import * as React from "react";

const neverChanges = () => () => {};

/**
 * False during server render and the hydration pass, true afterwards — for the
 * handful of controls whose correct output is only knowable in the browser.
 * useSyncExternalStore rather than an effect: `react-hooks/set-state-in-effect`
 * rejects the usual `setMounted(true)` and React schedules the extra render for
 * us when the two snapshots disagree.
 */
export function useIsHydrated(): boolean {
  return React.useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
}
