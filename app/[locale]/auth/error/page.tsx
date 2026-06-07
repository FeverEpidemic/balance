import Link from "next/link";
import { Notice } from "@/components/ui/notice";
import { sanitizeRedirectPath } from "@/lib/auth-flow";
import { localizePath, resolveLocale } from "@/lib/i18n";

export default async function AuthErrorPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ message?: string; next?: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const query = await searchParams;
  const safeNext = sanitizeRedirectPath(query.next);
  const loginHref =
    safeNext === "/dashboard"
      ? localizePath(locale, "/login")
      : `${localizePath(locale, "/login")}?next=${encodeURIComponent(safeNext)}`;

  return (
    <main className="page-wrap section-gap">
      <div className="mx-auto max-w-xl card">
        <p className="eyebrow">Auth Error</p>
        <h1 className="headline-lg mt-3">{locale === "en" ? "Verification failed" : "Verifikasi tidak berhasil"}</h1>
        <div className="mt-6">
          <Notice tone="error">{query.message ?? (locale === "en" ? "The authentication link could not be processed." : "Tautan autentikasi tidak dapat diproses.")}</Notice>
        </div>
        <div className="mt-6">
          <Link href={loginHref} className="font-label text-sm text-primary">
            {locale === "en" ? "Back to login" : "Kembali ke login"}
          </Link>
        </div>
      </div>
    </main>
  );
}
