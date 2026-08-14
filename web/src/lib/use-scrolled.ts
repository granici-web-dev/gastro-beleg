"use client";

import * as React from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

/**
 * True once the window has scrolled past `threshold`.
 *
 * Read through useSyncExternalStore rather than an effect: reading the initial
 * scroll position in an effect body both trips react-hooks/set-state-in-effect
 * and paints one frame in the wrong state when the browser restores a scroll
 * position on back-navigation.
 */
export function useScrolledPast(threshold: number): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => window.scrollY > threshold,
    () => false,
  );
}
