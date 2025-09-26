"use client";
import React from "react";

export default function MessageList({ messages, onStatusChange }) {
  return (
    <div>
      {messages.length === 0 && <p>No hay mensajes todavía.</p>}
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 4,
          }}
        >
          <p>
            <strong>{m.alias || "Anónimo"}:</strong> {m.content}
          </p>
          <p>Estado: {m.status}</p>
          {onStatusChange && (
            <button
              onClick={() => onStatusChange(m.id, m.status === "PENDING" ? "FULFILLED" : "PENDING")}
              style={{ marginTop: 5 }}
            >
              {m.status === "PENDING" ? "Desbloquear" : "Volver a bloquear"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
