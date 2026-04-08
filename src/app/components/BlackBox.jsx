"use client";

import Image from "next/image";

export default function BlackBox() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "220px",
          height: "220px",
          marginBottom: "1.5rem",
          filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.3))",
        }}
      >
        <Image
          src="/blackboxtest.png"
          alt="Black Box AI"
          fill
          style={{
            objectFit: "contain",
          }}
          priority
        />
      </div>

      <div
        style={{
          fontSize: "0.85rem",
          letterSpacing: "0.2em",
          fontWeight: 600,
          color: "var(--color-text-tertiary)",
        }}
      >
        COMING SOON
      </div>
    </div>
  );
}
