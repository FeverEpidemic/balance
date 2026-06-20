"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight pull-to-refresh wrapper for mobile.
 * Listens for touch events and shows a pull indicator + spinner.
 * On release past threshold, calls router.refresh().
 *
 * Only activates when scrolled to the top (window.scrollY <= 0).
 * Desktop unaffected (no touch events fire).
 */
export function PullToRefresh({
  children,
  threshold = 80,
}: {
  children: React.ReactNode;
  threshold?: number;
}) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
    }, 800);
  }, [router]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current || isRefreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      // Rubber-band: dampen pull the further user drags
      setPullDistance(Math.min(diff * 0.4, threshold * 1.5));
    }
  };

  const onTouchEnd = () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= threshold) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      {/* Pull indicator / spinner */}
      <div
        className={cn(
          "flex items-center justify-center transition-all duration-200",
          isRefreshing ? "h-12 opacity-100" : pullDistance > 0 ? "opacity-100" : "opacity-0",
        )}
        style={{ height: isRefreshing ? 48 : pullDistance }}
      >
        <div
          className={cn(
            "h-6 w-6 rounded-full border-2 border-primary border-t-transparent",
            isRefreshing ? "animate-spin" : "",
          )}
          style={{
            transform: `rotate(${pullDistance * 3}deg)`,
            transition: isRefreshing ? "none" : "transform 0.1s",
          }}
        />
      </div>
      {children}
    </div>
  );
}
