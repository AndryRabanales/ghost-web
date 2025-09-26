"use client";
import React, { useState } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "https://tu-app.vercel.app";

export default function MessageList({ messages = [], onStatusChange }) {
  const [openIds, setOpenIds] = useState({});
  const [replyText, setReplyText] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const handleClick = async (msg) => {
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
      setOpenIds((prev) => ({ ...prev, [msg.id]: true }));
    } else {
      setOpenIds((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }));
    }
  };

  const handleReply = async (msg) => {
    if (!replyText[msg.id] || !replyText[msg.id].trim()) return;
    try {
      await fetch(`${API}/messages/${msg.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText[msg.id] }),
      });
      setReplyText((prev) => ({ ...prev, [msg.id]: "" }));
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error("Error enviando respuesta:", err);
    }
  };

  const copyLink = (msg) => {
    const link = `${FRONTEND_URL}/reply/${msg.replyToken}`;
    navigator.clipboard.writeText(link);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ marginTop: 20 }}>
      {messages.length === 0 && (
        <p style={{ textAlign: "center" }}>No hay mensajes aún</p>
      )}
      {messages.map((msg) => {
        const isOpen = openIds[msg.id];
        let background = "#f0f0f0";
        if (!msg.seen) background = "#f0f0f0";
        else if (isOpen) background = "#d1f2d1";
        else background = "#e6e6e6";

        return (
          <div
            key={msg.id}
            style={{
              marginBottom: 15,
              padding: 15,
              border: "1px solid #ccc",
              borderRadius: 8,
              backgroundColor: background,
            }}
          >
            {/* Etiquetas */}
            {!msg.seen && (
              <p
                onClick={() => handleClick(msg)}
                style={{
                  fontWeight: "bold",
                  marginBottom: 5,
                  color: "#333",
                  cursor: "pointer",
                }}
              >
                Sin leer – haz click para ver
              </p>
            )}
            {msg.seen && !isOpen && (
              <p
                onClick={() => handleClick(msg)}
                style={{
                  fontWeight: "bold",
                  marginBottom: 5,
                  color: "#555",
                  cursor: "pointer",
                }}
              >
                Leído – haz click para desplegar
              </p>
            )}

            {/* contenido */}
            {msg.seen && isOpen && (
              <>
                <p style={{ margin: 0, color: "#444" }}>
                  <strong>Alias:</strong> {msg.alias || "Anónimo"}
                </p>
                <p style={{ marginTop: 4, color: "#000" }}>{msg.content}</p>

                {/* botón copiar link */}
                <button
                  onClick={() => copyLink(msg)}
                  style={{
                    marginTop: 8,
                    padding: "6px 10px",
                    backgroundColor: "#2196F3",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 4,
                  }}
                >
                  {copiedId === msg.id ? "¡Link copiado!" : "Copiar link de respuesta"}
                </button>

                {/* Respuestas */}
                {msg.responses && msg.responses.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <strong>Respuestas:</strong>
                    {msg.responses.map((r) => (
                      <div key={r.id} style={{ padding: "5px 0" }}>
                        <p style={{ margin: 0 }}>{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Campo para responder */}
                <div style={{ marginTop: 10 }}>
                  <textarea
                    placeholder="Escribe tu respuesta..."
                    value={replyText[msg.id] || ""}
                    onChange={(e) =>
                      setReplyText((prev) => ({
                        ...prev,
                        [msg.id]: e.target.value,
                      }))
                    }
                    style={{ width: "100%", minHeight: 60, padding: 8 }}
                  />
                  <button
                    onClick={() => handleReply(msg)}
                    style={{
                      marginTop: 5,
                      padding: "8px 16px",
                      backgroundColor: "#4CAF50",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Responder
                  </button>
                </div>
              </>
            )}

            {msg.seen && !isOpen && (
              <p style={{ color: "#999", fontStyle: "italic" }}>
                Mensaje oculto (Leído).
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
