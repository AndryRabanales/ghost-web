// components/LivesStatus.jsx
"use client";
import React from "react";

export default function LivesStatus({ creator }) {
  if (!creator) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      {creator.isPremium ? (
        <div style={{ color: "gold" }}>
          ⭐ Premium activo <br />
          ❤️ Vidas restantes: ∞ <br />
          ⏳ Próxima vida en: ilimitadas
        </div>
      ) : (
        <div style={{ color: "#444" }}>
          ❤️ Vidas restantes: {creator.lives} <br />
          ⏳ Próxima vida en: {creator.minutesToNextLife} min
        </div>
      )}
    </div>
  );
}
