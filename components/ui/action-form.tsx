"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useTransition,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject
} from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/app/actions/action-result";
import { initialActionResult } from "@/app/actions/action-result";
import { useToast } from "@/components/ui/toast-provider";

type ServerAction = (previousState: ActionResult, formData: FormData) => Promise<ActionResult>;

type ActionFormRenderProps = {
  pending: boolean;
  state: ActionResult;
};

type ActionFormProps = Omit<ComponentPropsWithoutRef<"form">, "action" | "children"> & {
  action: ServerAction;
  children: ReactNode | ((props: ActionFormRenderProps) => ReactNode);
  initialState?: ActionResult;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
};

export function useActionToastRefresh(
  state: ActionResult,
  options: {
    formRef?: RefObject<HTMLFormElement | null>;
    onSuccess?: () => void;
    resetOnSuccess?: boolean;
  } = {}
) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [isRefreshing, startTransition] = useTransition();
  const lastHandledStateRef = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (state.status === "idle") {
      return;
    }

    if (lastHandledStateRef.current === state) {
      return;
    }

    lastHandledStateRef.current = state;

    if (state.message) {
      pushToast({
        tone: state.status === "error" ? "error" : "success",
        description: state.message
      });
    }

    if (state.status !== "success") {
      return;
    }

    if (options.resetOnSuccess || state.resetForm) {
      options.formRef?.current?.reset();
    }

    options.onSuccess?.();

    startTransition(() => {
      router.refresh();
    });
  }, [options, pushToast, router, state]);

  return {
    isRefreshing
  };
}

export function ActionForm({
  action,
  children,
  initialState = initialActionResult,
  onSuccess,
  resetOnSuccess = false,
  ...props
}: ActionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, initialState);
  const { isRefreshing } = useActionToastRefresh(state, {
    formRef,
    onSuccess,
    resetOnSuccess
  });

  return (
    <form {...props} action={formAction} ref={formRef}>
      {typeof children === "function" ? children({ pending: pending || isRefreshing, state }) : children}
    </form>
  );
}
