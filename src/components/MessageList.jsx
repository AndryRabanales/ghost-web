"use client";
import React from "react";

export default function MessageList({ messages, onSeenToggle }) {
  if (!messages.length) return <p>No hay mensajes todavía.</p>;

  return (
    <div>
      {messages.map((msg) => {
        // decidir el texto del botón
        let buttonText = "";
        if (!msg.seen) {
          buttonText = "Sin leer";
        } else {
          buttonText = "Visto (clic para bloquear de nuevo)";
        }

        return (
          <div
            key={msg.id}
            style={{
              background: msg.seen ? "#f0f0f0" : "#ddd",
              padding: 12,
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            <p>
              <strong>Alias:</strong> {msg.alias || "Anónimo"}
            </p>

            {/* mensaje tapado si no está visto */}
            <p>
              {msg.seen ? (
                msg.content
              ) : (
                <span style={{ color: "#666" }}>🔒 Mensaje bloqueado</span>
              )}
            </p>

            <button
              onClick={() => onSeenToggle(msg.id, !msg.seen)}
              style={{
                marginTop: 6,
                padding: "6px 12px",
                backgroundColor: msg.seen ? "#aaa" : "#4CAF50",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {buttonText}
            </button>
          </div>
        );
      })}
    </div>
  );
}
