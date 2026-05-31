import { describe, expect, it } from "vitest";
import { sanitizeRedirectPath, withAuthMessage } from "../../lib/auth-flow";

describe("auth flow helpers", () => {
  it("accepts internal app paths and rejects external redirects", () => {
    expect(sanitizeRedirectPath("/invite/token-123")).toBe("/invite/token-123");
    expect(sanitizeRedirectPath("https://evil.example")).toBe("/dashboard");
    expect(sanitizeRedirectPath("//evil.example/path")).toBe("/dashboard");
  });

  it("preserves safe next targets in auth messages", () => {
    expect(withAuthMessage("/login", "error", "Gagal login", "/invite/token-123")).toBe(
      "/login?error=Gagal+login&next=%2Finvite%2Ftoken-123"
    );
  });

  it("omits next when the target falls back to the default destination", () => {
    expect(withAuthMessage("/login", "message", "Silakan coba lagi", "https://evil.example")).toBe(
      "/login?message=Silakan+coba+lagi"
    );
  });
});
