"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TRANSITION_MS = 520;

function RouteTransitionInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const previousKey = useRef<string | null>(null);

  useEffect(() => {
    const nextKey = `${pathname}?${searchParams.toString()}`;

    if (previousKey.current === null) {
      previousKey.current = nextKey;
      return;
    }

    if (previousKey.current === nextKey) {
      return;
    }

    previousKey.current = nextKey;
    setActive(true);

    const timeout = window.setTimeout(() => {
      setActive(false);
    }, TRANSITION_MS);

    return () => window.clearTimeout(timeout);
  }, [pathname, searchParams]);

  return (
    <>
      <div className={cn("route-transition-bar", active ? "route-transition-bar-active" : "")} aria-hidden="true" />
      <div className={cn("route-transition-veil", active ? "route-transition-veil-active" : "")} aria-hidden="true" />
    </>
  );
}

export function RouteTransition() {
  return (
    <Suspense fallback={null}>
      <RouteTransitionInner />
    </Suspense>
  );
}
