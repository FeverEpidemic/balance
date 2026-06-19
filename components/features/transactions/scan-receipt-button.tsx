"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { OcrTransactionResult } from "@/lib/ai/ocr-prompt";

const OCR_ENDPOINT = "/api/ai/ocr-scan";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_DIMENSION = 1920;

type ScanStatus = "idle" | "compressing" | "scanning";

type ScanReceiptButtonProps = {
  onScanComplete: (result: OcrTransactionResult) => void;
  disabled?: boolean;
};

/**
 * Client-side image compression: resize to 1920px max, output JPEG @ 0.8 quality.
 * Reduces bandwidth, API cost, and avoids HEIC compatibility issues.
 */
async function compressImage(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  let { width, height } = img;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
      "image/jpeg",
      0.8
    );
  });
}

export function ScanReceiptButton({ onScanComplete, disabled }: ScanReceiptButtonProps) {
  const [status, setStatus] = useState<ScanStatus>("idle");

  const handleFile = useCallback(async (file: File | null) => {
    if (!file || status !== "idle") return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }

    setStatus("compressing");
    try {
      const compressed = await compressImage(file);
      setStatus("scanning");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const formData = new FormData();
      formData.append("image", compressed, "receipt.jpg");

      const response = await fetch(OCR_ENDPOINT, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        result?: OcrTransactionResult;
      };

      if (data.ok && data.result) {
        onScanComplete(data.result);
        setStatus("idle");
      } else if (response.status === 429) {
        toast.error(data.error ?? "Terlalu banyak scan. Tunggu beberapa saat.");
        setStatus("idle");
      } else if (response.status === 422) {
        toast.error(data.error ?? "Tidak bisa membaca struk. Coba foto dengan lebih jelas.");
        setStatus("idle");
      } else {
        toast.error(data.error ?? "Gagal memindai. Coba lagi.");
        setStatus("idle");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast.error("Terlalu lama. Foto mungkin kurang jelas, coba lagi.");
      } else {
        toast.error("Koneksi terputus. Periksa internet dan coba lagi.");
      }
      setStatus("idle");
    }
  }, [status, onScanComplete]);

  function openCamera() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] ?? null;
      handleFile(file);
    };
    input.click();
  }

  function openGallery() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] ?? null;
      handleFile(file);
    };
    input.click();
  }

  const isLoading = status !== "idle";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="soft"
        disabled={disabled || isLoading}
        onClick={openCamera}
        className="gap-2"
      >
        {isLoading ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <span>📷</span>
        )}
        {status === "compressing" ? "Mengompresi gambar..." : status === "scanning" ? "Memproses..." : "Pindai Struk"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={disabled || isLoading}
        onClick={openGallery}
        className="gap-2 text-xs"
      >
        🖼️ Upload dari Galeri
      </Button>
    </div>
  );
}
