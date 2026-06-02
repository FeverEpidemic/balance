"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

function ToastFeedbackInner({ error, message }: { error?: string; message?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const lastShownKey = useRef<string | null>(null);

  useEffect(() => {
    const nextKey = JSON.stringify({ error: error ?? null, message: message ?? null, pathname });

    if (lastShownKey.current === nextKey) {
      return;
    }

    if (error) {
      pushToast({ tone: "error", description: error });
    }

    if (message) {
      pushToast({ tone: "success", description: message });
    }

    if (!error && !message) {
      lastShownKey.current = nextKey;
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    params.delete("message");

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    lastShownKey.current = nextKey;
    router.replace(nextUrl, { scroll: false });
  }, [error, message, pathname, pushToast, router, searchParams]);

  return null;
}

export function ToastFeedback({ error, message }: { error?: string; message?: string }) {
  return (
    <Suspense fallback={null}>
      <ToastFeedbackInner error={error} message={message} />
    </Suspense>
  );
}
