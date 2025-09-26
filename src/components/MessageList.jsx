"use client";
import React, { useState } from "react";

export default function MessageList({ messages, onMarkSeen = () => {} }) {
  // local state para cada mensaje abierto/cerrado
  const [openIds, setOpenIds] = useState([]);

  const toggleMessage = (msg) => {
    // si está abierto, ciérralo
    if (openIds.includes(msg.id)) {
      // quitarlo del array
      setOpenIds(openIds.filter((id) => id !== msg.id));
    } else {
      // abrirlo
      setOpenIds([...openIds, msg.id]);
      if (!msg.seen) {
        // si aún no está visto en BD, márcalo
        onMarkSeen(msg.id);
      }
    }
  };

  return (
    <div>
      {messages.map((msg) => {
        const isOpen = openIds.includes(msg.id);
        const statusText = !msg.seen ? "Sin leer" : isOpen ? "Visto" : "Leído";

        return (
          <div
            key={msg.id}
            onClick={() => toggleMessage(msg)}
            style={{
              marginBottom: "15px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: isOpen ? "#f8f8f8" : "#e0e0e0",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: "12px", color: "#555" }}>{statusText}</div>
            <div style={{ fontWeight: "bold" }}>
              Alias: {msg.alias || "Anónimo"}
            </div>
            {isOpen ? (
              <div style={{ color: "#000", marginTop: "4px" }}>{msg.content}</div>
            ) : (
              <div style={{ color: "#999", marginTop: "4px" }}>
                (Mensaje oculto)
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
