"use client";
import React from "react";

export default function MessageList({ messages, onToggleSeen }) {
  if (!messages || messages.length === 0) {
    return <p>No hay mensajes todavía.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            padding: "14px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#fff",
            color: "#000",
            cursor: "pointer",
          }}
          onClick={() => {
            // alternar el valor: si está visto, enviamos false; si está oculto, true
            onToggleSeen(msg.id, !msg.seen);
          }}
        >
          {!msg.seen ? (
            <p style={{ color: "#666", fontWeight: "bold" }}>🔒 Desbloquear</p>
          ) : (
            <>
              <p style={{ margin: 0, fontWeight: "bold" }}>
                Alias: {msg.alias || "Anónimo"}
              </p>
              <p style={{ marginTop: "6px" }}>{msg.content}</p>
              <p style={{ fontSize: "12px", color: "green" }}>✅ Desbloqueado</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
