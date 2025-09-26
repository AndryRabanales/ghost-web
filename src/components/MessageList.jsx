"use client";
import React, { useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageList({ messages = [], onStatusChange }) {
  // estado local de qué mensajes están abiertos en la UI
  const [openIds, setOpenIds] = useState({});

  const handleClick = async (msg) => {
    // Si aún no está visto en DB, primero lo marcamos como visto y lo abrimos
    if (!msg.seen) {
      try {
        await fetch(`${API}/messages/${msg.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seen: true }),
        });
        if (onStatusChange) onStatusChange();
      } catch (err) {
        console.error("Error actualizando estado:", err);
      }
      // al ser nuevo, lo abrimos
      setOpenIds((prev) => ({ ...prev, [msg.id]: true }));
    } else {
      // Si ya estaba visto, alternamos sólo el abierto/cerrado localmente
      setOpenIds((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }));
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      {messages.length === 0 && (
        <p style={{ textAlign: "center" }}>No hay mensajes aún</p>
      )}
      {messages.map((msg) => {
        const isOpen = openIds[msg.id]; // abierto en UI

        // colores según estado
        let background = "#f0f0f0"; // gris por defecto
        if (!msg.seen) background = "#f0f0f0"; // sin leer gris
        else if (isOpen) background = "#d1f2d1"; // leído y abierto verde
        else background = "#e6e6e6"; // leído y cerrado gris claro

        return (
          <div
            key={msg.id}
            onClick={() => handleClick(msg)}
            style={{
              marginBottom: 15,
              padding: 15,
              border: "1px solid #ccc",
              borderRadius: 8,
              backgroundColor: background,
              cursor: "pointer",
            }}
          >
            {/* Etiqueta: solo mostrar si sin leer o leído-cerrado */}
            {!msg.seen && (
              <p
                style={{
                  fontWeight: "bold",
                  marginBottom: 5,
                  color: "#333",
                }}
              >
                Sin leer
              </p>
            )}
            {msg.seen && !isOpen && (
              <p
                style={{
                  fontWeight: "bold",
                  marginBottom: 5,
                  color: "#555",
                }}
              >
                Leído
              </p>
            )}

            {/* contenido */}
            {!msg.seen && (
              <p style={{ color: "#999", fontStyle: "italic" }}>
                Mensaje bloqueado, haz click para ver
              </p>
            )}
            {msg.seen && isOpen && (
              <>
                <p style={{ margin: 0, color: "#444" }}>
                  <strong>Alias:</strong> {msg.alias || "Anónimo"}
                </p>
                <p style={{ marginTop: 4, color: "#000" }}>{msg.content}</p>
              </>
            )}
            {msg.seen && !isOpen && (
              <p style={{ color: "#999", fontStyle: "italic" }}>
                Mensaje oculto (Leído). Haz click para desplegar
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
