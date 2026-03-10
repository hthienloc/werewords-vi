"use client";

import { useEffect } from "react";

/**
 * Locks the back button by pushing a new history entry whenever the user attempts to go back.
 * Useful for pass-and-play screens where accidental back navigation would leak roles.
 */
export function useBackLock(active: boolean = true) {
  useEffect(() => {
    if (!active) return;

    // Push initial state
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // Re-push state to keep user on same page
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [active]);
}
