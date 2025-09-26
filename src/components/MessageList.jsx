"use client";
import React from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageList({ messages = [], onStatusChange }) {
  const markAsSeen = async (msg) => {
    try {
      // solo marcamos como visto si aún no está visto
      if (!msg.seen) {
        await fetch(`${API}/messages/${msg.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seen: true }),
        });
        if (onStatusChange) onStatusChange();
      }
    } catch (err) {
      console.error("Error actualizando estado:", err);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      {messages.length === 0 && (
        <p style={{ textAlign: "center" }}>No hay mensajes aún</p>
      )}
      {messages.map((msg) => {
        const etiqueta = msg.seen ? "Leído" : "Sin leer";

        return (
          <div
            key={msg.id}
            onClick={() => markAsSeen(msg)}
            style={{
              marginBottom: 15,
              padding: 15,
              border: "1px solid #ccc",
              borderRadius: 8,
              backgroundColor: msg.seen ? "#e0ffe0" : "#f0f0f0",
              cursor: "pointer",
            }}
          >
            <p
              style={{
                fontWeight: "bold",
                marginBottom: 5,
                color: "#333",
              }}
            >
              {etiqueta}
            </p>
            {!msg.seen ? (
              <p style={{ color: "#999", fontStyle: "italic" }}>
                Mensaje bloqueado, haz click para ver
              </p>
            ) : (
              <>
                <p style={{ margin: 0, color: "#444" }}>
                  <strong>Alias:</strong> {msg.alias || "Anónimo"}
                </p>
                <p style={{ marginTop: 4, color: "#000" }}>{msg.content}</p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
