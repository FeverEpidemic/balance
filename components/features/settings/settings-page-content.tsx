"use client";

import { useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { updateThemePreference } from "@/app/actions/theme";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { createApiKey, revokeApiKey, deleteApiKey } from "@/app/actions/api-keys";
import { initialActionResult } from "@/app/actions/action-result";
import type { SettingsData } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const themeOptions = [
  {
    value: "system",
    label: "Ikuti sistem",
    description: "Otomatis menyesuaikan tampilan perangkat Anda."
  },
  {
    value: "light",
    label: "Terang",
    description: "Gunakan tampilan krem terang khas Balance."
  },
  {
    value: "dark",
    label: "Gelap",
    description: "Gunakan mode gelap yang tetap tenang dan nyaman."
  }
] as const;

export function SettingsPageContent({ settings }: { settings: SettingsData }) {
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);
  const prevCreateStatusRef = useRef<"idle" | "success" | "error">("idle");

  return (
    <AppShell
      currentPath="/settings"
      title="Pengaturan"
      subtitle="Kelola API key untuk akses otomatis"
      userName={settings.shell.userName}
      walletCount={settings.shell.walletCount}
      budgetCount={settings.shell.budgetCount}
      memberCount={settings.shell.memberCount}
      primaryWalletId={settings.shell.primaryWalletId}
    >
      <div className="space-y-6">
        <section className="card">
          <h3 className="headline-sm">Tema Aplikasi</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Pilih tampilan yang paling nyaman. Opsi ini tersimpan ke akun Anda dan dibawa ke perangkat lain saat login.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {themeOptions.map((option) => {
              const isActive = settings.themePreference === option.value;

              return (
                <ActionForm
                  key={option.value}
                  action={updateThemePreference}
                  initialState={initialActionResult}
                >
                  {({ pending }) => (
                    <>
                      <input type="hidden" name="theme_preference" value={option.value} />
                      <button
                        type="submit"
                        disabled={pending}
                        className={cn(
                          "flex h-full w-full flex-col items-start rounded-[1.25rem] border p-4 text-left transition",
                          isActive
                            ? "border-primary bg-primary-soft text-foreground shadow-serene"
                            : "border-border bg-overlay text-foreground hover:border-primary/35 hover:bg-card"
                        )}
                      >
                        <span className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {isActive ? "Aktif" : "Tema"}
                        </span>
                        <span className="mt-3 headline-md">{option.label}</span>
                        <span className="mt-2 text-sm leading-6 text-muted-foreground">{option.description}</span>
                      </button>
                    </>
                  )}
                </ActionForm>
              );
            })}
          </div>
        </section>

        <section className="card">
          <h3 className="headline-sm">Buat API Key Baru</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            API key digunakan oleh Hermes atau agent AI untuk membaca ringkasan keuangan dan menulis transaksi tanpa kredensial penuh. Simpan key baik-baik — key hanya ditampilkan sekali setelah dibuat.
          </p>

          <ActionForm
            action={createApiKey}
            className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end"
            initialState={initialActionResult}
            resetOnSuccess
          >
            {({ state }) => {
              if (state.status === "success" && state.message && prevCreateStatusRef.current !== "success") {
                prevCreateStatusRef.current = "success";
                if (state.message.length > 20) {
                  setNewKeyResult(state.message);
                }
              }

              if (state.status === "idle") {
                prevCreateStatusRef.current = "idle";
              }

              return (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="font-label text-xs text-muted-foreground uppercase tracking-[0.12em]">Nama Key</span>
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder="misal: Hermes Bot"
                      className="mt-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-6 py-2.5 font-label text-xs font-semibold uppercase tracking-[0.12em] text-[var(--button-primary-text)] transition hover:bg-primary-hover"
                  >
                    Buat Key
                  </button>
                </>
              );
            }}
          </ActionForm>

          {newKeyResult ? (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary-soft p-4">
              <p className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-primary-strong">API Key Baru</p>
              <p className="mt-2 break-all font-mono text-sm text-foreground">{newKeyResult}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Salin key ini sekarang. Key tidak akan ditampilkan lagi setelah Anda meninggalkan halaman ini.
              </p>
              <button
                type="button"
                className="mt-3 rounded-full bg-card px-4 py-1.5 font-label text-xs font-semibold text-primary-strong transition hover:bg-overlay"
                onClick={() => setNewKeyResult(null)}
              >
                Saya sudah menyalin
              </button>
            </div>
          ) : null}
        </section>

        <section className="card">
          <h3 className="headline-sm">Daftar API Key</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Key yang sudah dicabut tidak bisa digunakan lagi. Anda bisa menghapus key permanen dari daftar ini.
          </p>

          {settings.apiKeys.length === 0 ? (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Belum ada API key. Buat key pertama Anda di atas.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {settings.apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{key.name}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{key.keyPrefix}…</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Dibuat {new Date(key.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      {key.lastUsedAt ? ` — Terakhir dipakai ${new Date(key.lastUsedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                    </p>
                    {key.isRevoked ? (
                      <p className="theme-danger-pill mt-2 inline-flex rounded-full px-2.5 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em]">Dicabut</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {!key.isRevoked ? (
                      <ActionForm
                        action={revokeApiKey}
                        className="contents"
                        initialState={initialActionResult}
                      >
                        <input type="hidden" name="key_id" value={key.id} />
                        <button
                          type="submit"
                          className="theme-danger-pill rounded-full px-4 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition hover:opacity-90"
                        >
                          Cabut
                        </button>
                      </ActionForm>
                    ) : (
                      <ActionForm
                        action={deleteApiKey}
                        className="contents"
                        initialState={initialActionResult}
                      >
                        <input type="hidden" name="key_id" value={key.id} />
                        <ConfirmSubmitButton
                          confirmMessage="Hapus permanen API key ini?"
                          className="rounded-full border border-border bg-card px-4 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition hover:border-[var(--danger-border)] hover:text-danger"
                        >
                          Hapus
                        </ConfirmSubmitButton>
                      </ActionForm>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
