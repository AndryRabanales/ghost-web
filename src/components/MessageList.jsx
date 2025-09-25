"use client";
import React from "react";

export default function MessageList({ messages, onStatusChange }) {
  if (!messages || messages.length === 0) {
    return <p style={{ padding: 20 }}>No hay mensajes aún.</p>;
  }

  return (
    <div style={{ marginTop: 20 }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
          }}
        >
          {/* cabecera: fecha + alias si existe */}
          <div style={{ marginBottom: 6 }}>
            <strong>{new Date(msg.createdAt).toLocaleString()}</strong>
            {msg.alias && (
              <span style={{ marginLeft: 8, fontStyle: "italic", color: "#555" }}>
                por {msg.alias}
              </span>
            )}
            {!msg.alias && (
              <span style={{ marginLeft: 8, color: "#888" }}>
                (anónimo)
              </span>
            )}
          </div>

          {/* contenido */}
          <div style={{ marginBottom: 6 }}>{msg.content}</div>

          {/* estado */}
          <div>Estado: {msg.status}</div>

          {/* acciones */}
          {onStatusChange && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => onStatusChange(msg.id, "FULFILLED")}
                style={{ background: "green", color: "white", marginRight: 8 }}
              >
                ✔ Cumplida
              </button>
              <button
                onClick={() => onStatusChange(msg.id, "NOT_FULFILLED")}
                style={{ background: "red", color: "white" }}
              >
                ✖ No cumplida
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
