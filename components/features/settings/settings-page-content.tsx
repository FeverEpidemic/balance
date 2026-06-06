"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { createApiKey, revokeApiKey, deleteApiKey } from "@/app/actions/api-keys";
import type { ActionResult } from "@/app/actions/action-result";
import { initialActionResult } from "@/app/actions/action-result";
import type { SettingsData } from "@/lib/data/types";

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
                      className="mt-1 rounded-xl border border-border bg-surface px-4 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/60"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-6 py-2.5 font-label text-xs font-semibold text-white uppercase tracking-[0.12em] transition hover:bg-primary-hover"
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
                className="mt-3 rounded-full bg-white px-4 py-1.5 font-label text-xs font-semibold text-primary-strong transition hover:bg-white/70"
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
                      <p className="mt-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-red-600">Dicabut</p>
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
                          className="rounded-full border border-red-200 bg-red-50 px-4 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-100"
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
                          className="rounded-full border border-border bg-white px-4 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-red-50 hover:text-red-700"
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