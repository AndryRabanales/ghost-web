"use client";
import React, { useState, useEffect } from "react";

export default function MessageList({ messages, onMarkSeen }) {
  // estado local para controlar si está abierto o cerrado cada mensaje
  const [openStates, setOpenStates] = useState({});

  // cada vez que cambian los mensajes, reinicializamos estados abiertos a false
  useEffect(() => {
    const init = {};
    messages.forEach((m) => {
      init[m.id] = false; // por defecto cerrado
    });
    setOpenStates(init);
  }, [messages]);

  const toggleMessage = (msg) => {
    // si nunca ha sido leído, marcamos como visto en BD
    if (!msg.seen) {
      onMarkSeen(msg.id); // solo hace PATCH seen=true
    }
    // invertimos estado abierto/cerrado
    setOpenStates((prev) => ({
      ...prev,
      [msg.id]: !prev[msg.id],
    }));
  };

  if (!messages.length) return <p>No hay mensajes todavía.</p>;

  return (
    <div>
      {messages.map((msg) => {
        const isOpen = openStates[msg.id]; // abierto o cerrado localmente
        // texto del botón
        let buttonText;
        if (!msg.seen) buttonText = "Sin leer (clic para desbloquear)";
        else if (isOpen) buttonText = "Leído (clic para cerrar)";
        else buttonText = "Leído (clic para abrir)";

        return (
          <div
            key={msg.id}
            style={{
              background: "#f9f9f9",
              padding: 12,
              borderRadius: 6,
              marginBottom: 10,
              color: "#000",
            }}
          >
            <p>
              <strong>Alias:</strong> {msg.alias || "Anónimo"}
            </p>

            <p>
              {isOpen
                ? msg.content
                : msg.seen
                ? "🔒 Mensaje leído (cerrado)"
                : "🔒 Mensaje bloqueado"}
            </p>

            <button
              onClick={() => toggleMessage(msg)}
              style={{
                marginTop: 6,
                padding: "6px 12px",
                backgroundColor: isOpen ? "#aaa" : "#4CAF50",
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
