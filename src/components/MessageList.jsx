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
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            backgroundColor: "#f9f9f9",
            cursor: !msg.seen ? "pointer" : "default",
          }}
          onClick={() => {
            if (!msg.seen) {
              onToggleSeen(msg.id, true);
            }
          }}
        >
          {!msg.seen ? (
            <p style={{ color: "#999" }}>🔒 Mensaje bloqueado (haz click para ver)</p>
          ) : (
            <>
              <strong>{msg.alias || "Anónimo"}</strong>
              <p style={{ marginTop: "4px" }}>{msg.content}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
