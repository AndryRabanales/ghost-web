"use client";
import React, { useState } from "react";

export default function MessageList({ messages, onMarkSeen }) {
  // estado local: qué mensajes están desplegados en este momento
  const [open, setOpen] = useState({}); // { [id]: true|false }

  if (!messages || messages.length === 0) {
    return <p>No hay mensajes todavía.</p>;
  }

  const toggleOpen = (msg) => {
    // Si nunca se ha leído, al primer clic lo marcamos como leído en BD
    if (!msg.seen) {
      onMarkSeen(msg.id); // no hace falta esperar; el padre refresca la lista
    }
    setOpen((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {messages.map((msg) => {
        const isOpen = !!open[msg.id]; // abierto en esta sesión
        const isSeen = !!msg.seen;     // persistido en BD

        return (
          <div
            key={msg.id}
            onClick={() => toggleOpen(msg)}
            style={{
              padding: "14px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              backgroundColor: "#fff", // fondo claro
              color: "#111",           // texto oscuro
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            {/* Badges de estado */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: isSeen ? "rgba(16,185,129,0.12)" : "rgba(107,114,128,0.15)",
                  color: isSeen ? "#065f46" : "#374151",
                  fontWeight: 600,
                }}
              >
                {isSeen ? "Leído" : "Sin leer"}
              </span>

              <span style={{ fontSize: 12, color: "#6b7280" }}>
                {isOpen ? "Ocultar" : "Ver"}
              </span>
            </div>

            {/* Contenido */}
            {isOpen ? (
              <div style={{ marginTop: 10 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>
                  Alias: {msg.alias || "Anónimo"}
                </p>
                <p style={{ marginTop: 6, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                  {msg.content}
                </p>
              </div>
            ) : (
              <p style={{ marginTop: 10, color: "#6b7280", fontStyle: "italic" }}>
                (Haz clic para ver el contenido)
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
