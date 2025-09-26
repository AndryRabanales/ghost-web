"use client";
import React, { useState } from "react";

export default function MessageList({ messages, onMarkSeen }) {
  const [open, setOpen] = useState({});

  if (!messages || messages.length === 0) {
    return <p>No hay mensajes todavía.</p>;
  }

  const toggleOpen = (msg) => {
    // Si no está marcado como visto en BD, lo marcamos
    if (!msg.seen && onMarkSeen) {
      onMarkSeen(msg.id);
    }
    // toggle en el frontend
    setOpen((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {messages.map((msg) => {
        const isOpen = open[msg.id]; // estado de apertura en frontend
        return (
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
            onClick={() => toggleOpen(msg)}
          >
            {!msg.seen ? (
              <p style={{ margin: 0, color: "#666", fontWeight: "bold" }}>
                🔒 Sin leer
              </p>
            ) : isOpen ? (
              <>
                <p style={{ margin: 0, fontWeight: "bold" }}>
                  Alias: {msg.alias || "Anónimo"}
                </p>
                <p style={{ marginTop: "6px" }}>{msg.content}</p>
                <p style={{ fontSize: "12px", color: "green" }}>✅ Visto</p>
              </>
            ) : (
              <p style={{ margin: 0, color: "green", fontWeight: "bold" }}>
                ✅ Visto (clic para volver a tapar)
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
