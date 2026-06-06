import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Balance",
    short_name: "Balance",
    description: "Aplikasi keuangan rumah tangga yang tenang, ringan, dan mobile responsive.",
    start_url: "/",
    display: "standalone",
    background_color: "#171c16",
    theme_color: "#595f3d",
    lang: "id-ID",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
