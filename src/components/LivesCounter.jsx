"use client";
import React from "react";

export default function LivesCounter({ livesLeft, maxLives, minutesToNextLife }) {
  return (
    <div style={{ marginTop: 12, padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8 }}>
      <h4>Vidas disponibles</h4>
      <div style={{ fontSize: 22, marginBottom: 6 }}>
        {/* ❤️ corazones llenos */}
        {"❤️".repeat(livesLeft)}
        {/* 🤍 corazones vacíos */}
        {"🤍".repeat(maxLives - livesLeft)}
      </div>
      {livesLeft === 0 ? (
        <p style={{ color: "red" }}>
          Sin vidas 😢 — Recuperas una en {minutesToNextLife} minutos
        </p>
      ) : (
        <p style={{ color: "#666" }}>
          {livesLeft}/{maxLives} disponibles
        </p>
      )}
      <div style={{ marginTop: 6 }}>
        <button
          style={{
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            padding: "6px 12px",
            borderRadius: 4,
            cursor: "pointer",
          }}
          onClick={() => alert("Aquí iría la lógica de Mercado Pago Premium")}
        >
          🚀 Hazte Premium
        </button>
      </div>
    </div>
  );
}
