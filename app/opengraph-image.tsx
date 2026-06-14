import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

export const alt = "Balance — Personal Finance Tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function Image() {
  const publicDir = path.join(process.cwd(), "public");

  const [hankenBuffer, interBuffer] = await Promise.all([
    fs.promises.readFile(path.join(publicDir, "fonts", "hanken-grotesk-700.ttf")),
    fs.promises.readFile(path.join(publicDir, "fonts", "inter-400.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background:
            "linear-gradient(135deg, #fbf9f3 0%, #edeae0 30%, #f0f2e6 70%, #fbf9f3 100%)",
          fontFamily: '"Hanken Grotesk"',
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 90px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle sage radial glow — upper-left */}
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -120,
            width: 540,
            height: 540,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(89,95,61,0.06) 0%, transparent 70%)",
          }}
        />

        {/* App name */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#595f3d",
            lineHeight: 1,
            marginBottom: 20,
            position: "relative",
            zIndex: 1,
          }}
        >
          Balance
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: "#46483e",
            fontFamily: "Inter",
            fontWeight: 400,
            opacity: 0.85,
            marginTop: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          Personal Finance Tracker
        </div>

        {/* Divider line */}
        <div
          style={{
            width: 52,
            height: 3,
            background: "#c7c7ba",
            borderRadius: 2,
            marginTop: 28,
            position: "relative",
            zIndex: 1,
          }}
        />

        {/* Growth curve SVG — right side */}
        <svg
          viewBox="0 0 440 220"
          style={{
            position: "absolute",
            right: 70,
            top: 200,
            width: 400,
            height: 200,
            overflow: "visible",
          }}
        >
          {/* Grid lines (very faint) */}
          <line
            x1="0"
            y1="50"
            x2="440"
            y2="50"
            stroke="#dbdad4"
            strokeWidth="0.5"
            opacity="0.4"
          />
          <line
            x1="0"
            y1="110"
            x2="440"
            y2="110"
            stroke="#dbdad4"
            strokeWidth="0.5"
            opacity="0.4"
          />
          <line
            x1="0"
            y1="170"
            x2="440"
            y2="170"
            stroke="#dbdad4"
            strokeWidth="0.5"
            opacity="0.4"
          />

          {/* Growth curve */}
          <path
            d="M0,180 C50,175 100,170 160,150 C220,130 270,90 340,70 C390,56 420,50 440,48"
            stroke="#717854"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* End dot */}
          <circle cx="440" cy="48" r="7" fill="#595f3d" />
          <circle cx="440" cy="48" r="14" fill="#595f3d" opacity="0.12" />
        </svg>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 44,
            left: 90,
            fontSize: 14,
            color: "#77786d",
            fontFamily: "Inter",
            fontWeight: 400,
            letterSpacing: "0.02em",
            zIndex: 1,
          }}
        >
          mybalance.my.id
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Hanken Grotesk",
          data: hankenBuffer,
          style: "normal",
          weight: 700,
        },
        {
          name: "Inter",
          data: interBuffer,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
