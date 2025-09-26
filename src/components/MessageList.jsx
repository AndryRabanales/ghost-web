"use client";
import React from "react";

const API = process.env.NEXT_PUBLIC_API || "http://localhost:3001";

/**
 * messages: array de mensajes [{id, alias, content, seen, createdAt}]
 * onStatusChange: callback opcional si quieres hacer algo más tras cambiar
 */
export default function MessageList({ messages = [], onStatusChange }) {
  const toggleSeen = async (msg) => {
    try {
      // Alternar seen: si estaba false pasa a true, si estaba true pasa a false
      const newSeen = !msg.seen;

      await fetch(`${API}/messages/${msg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seen: newSeen }),
      });

      if (onStatusChange) onStatusChange();
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
        // Etiqueta según estado
        let etiqueta = "Sin leer"; // default
        if (msg.seen) {
          etiqueta = "Leído";
        }

        return (
          <div
            key={msg.id}
            onClick={() => toggleSeen(msg)}
            style={{
              marginBottom: 15,
              padding: 15,
              border: "1px solid #ccc",
              borderRadius: 8,
              backgroundColor: msg.seen ? "#f5f5f5" : "#eee",
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
            {/* si no está visto, mostramos placeholder tapado */}
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
