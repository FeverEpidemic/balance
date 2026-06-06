export type ActionStatus = "idle" | "success" | "error";

export type ActionResult = {
  status: ActionStatus;
  message?: string;
  fieldErrors?: Record<string, string>;
  resetForm?: boolean;
};

export const initialActionResult: ActionResult = {
  status: "idle"
};

export function successResult(message: string, options: { fieldErrors?: Record<string, string>; resetForm?: boolean } = {}): ActionResult {
  return {
    status: "success",
    message,
    fieldErrors: options.fieldErrors,
    resetForm: options.resetForm ?? false
  };
}

export function errorResult(message: string, options: { fieldErrors?: Record<string, string> } = {}): ActionResult {
  return {
    status: "error",
    message,
    fieldErrors: options.fieldErrors
  };
}
