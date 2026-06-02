"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type GoogleSignInButtonProps = {
  callbackUrl: string;
  label: string;
};

export function GoogleSignInButton({ callbackUrl, label }: GoogleSignInButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      setError(null);

      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl
        }
      });

      if (oauthError) {
        setError("Google login belum bisa diproses. Silakan coba lagi.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "inline-flex min-h-[3.25rem] w-full min-w-0 max-w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-center font-label text-sm font-medium leading-tight text-foreground shadow-serene transition duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        <GoogleIcon />
        {isPending ? "Mengarahkan ke Google..." : label}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" role="img">
      <path
        d="M21.805 10.023H12.24v3.955h5.486c-.236 1.273-.959 2.352-2.045 3.073v2.55h3.312c1.939-1.785 3.052-4.416 3.052-7.551 0-.67-.06-1.314-.24-2.027Z"
        fill="#4285F4"
      />
      <path
        d="M12.24 22c2.76 0 5.08-.912 6.773-2.476l-3.312-2.55c-.919.617-2.093.984-3.46.984-2.657 0-4.906-1.793-5.71-4.2H3.11v2.63A10.224 10.224 0 0 0 12.24 22Z"
        fill="#34A853"
      />
      <path
        d="M6.53 13.758a6.146 6.146 0 0 1-.32-1.958c0-.68.117-1.34.32-1.958V7.212H3.11A10.21 10.21 0 0 0 2 11.8c0 1.646.393 3.205 1.11 4.588l3.42-2.63Z"
        fill="#FBBC05"
      />
      <path
        d="M12.24 5.642c1.5 0 2.842.516 3.9 1.529l2.925-2.924C17.314 2.648 15 1.6 12.24 1.6A10.224 10.224 0 0 0 3.11 7.212l3.42 2.63c.804-2.408 3.053-4.2 5.71-4.2Z"
        fill="#EA4335"
      />
    </svg>
  );
}
