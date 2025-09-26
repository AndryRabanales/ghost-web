"use client";
import React from "react";

export default function MessageList({ messages, onStatusChange }) {
  if (!messages.length) return <p>No hay mensajes aún</p>;

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {messages.map((m) => (
        <li
          key={m.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <p>
            <strong>
              {m.status === "PENDING" ? "🔒 Mensaje bloqueado" : m.content}
            </strong>
          </p>
          {m.alias && <p>Alias: {m.alias}</p>}
          {m.status === "PENDING" && (
            <button
              onClick={() => onStatusChange(m.id, "FULFILLED")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#2196F3",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Desbloquear
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
