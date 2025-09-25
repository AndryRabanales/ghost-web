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
          {/* Fecha */}
          <strong>{new Date(msg.createdAt).toLocaleString()}</strong>

          {/* Alias opcional */}
          {msg.alias && (
            <span
              style={{
                marginLeft: 8,
                fontStyle: "italic",
                color: "#555",
              }}
            >
              por {msg.alias}
            </span>
          )}

          {/* Contenido */}
          <div style={{ marginTop: 6 }}>{msg.content}</div>

          {/* Estado */}
          <div>Estado: {msg.status}</div>

          {/* Botones de estado */}
          <button
            onClick={() => onStatusChange(msg.id, "FULFILLED")}
            style={{
              background: "green",
              color: "white",
              marginRight: 5,
              marginTop: 5,
            }}
          >
            ✔ Cumplida
          </button>
          <button
            onClick={() => onStatusChange(msg.id, "NOT_FULFILLED")}
            style={{
              background: "red",
              color: "white",
              marginTop: 5,
            }}
          >
            ✖ No cumplida
          </button>
        </div>
      ))}
    </div>
  );
}
