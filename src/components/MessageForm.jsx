"use client";
import React, { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageForm({ publicId }) {
  const [content, setContent] = useState("");
  const [alias, setAlias] = useState("");
  const [links, setLinks] = useState([]);

  // Cargar alias guardado y lista de chats para este publicId
  useEffect(() => {
    const storedAlias = localStorage.getItem(`alias_${publicId}`);
    if (storedAlias) setAlias(storedAlias);

    const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
    const list = stored
      .filter((c) => c.publicId === publicId)
      .sort((a, b) => b.ts - a.ts);
    setLinks(list);
  }, [publicId]);

  // Polling cada 5s para detectar respuestas del creador
  useEffect(() => {
    const interval = setInterval(async () => {
      const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
      let updated = [...stored];
      for (let i = 0; i < updated.length; i++) {
        const c = updated[i];
        if (c.publicId !== publicId) continue;
        try {
          const res = await fetch(`${API}/chats/${c.anonToken}/${c.chatId}`);
          const data = await res.json();
          const hasReply = data.messages?.some((m) => m.from === "creator");
          updated[i].hasReply = hasReply;
        } catch (err) {
          console.error("Error comprobando respuesta:", err);
        }
      }
      localStorage.setItem("myChats", JSON.stringify(updated));
      const list = updated
        .filter((c) => c.publicId === publicId)
        .sort((a, b) => b.ts - a.ts);
      setLinks(list);
    }, 5000);
    return () => clearInterval(interval);
  }, [publicId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await fetch(`${API}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId, content, alias }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error creando chat");
        return;
      }

      if (alias) localStorage.setItem(`alias_${publicId}`, alias);

      const entry = {
        anonToken: data.anonToken,
        chatId: data.chatId,
        chatUrl: data.chatUrl,
        preview: content.slice(0, 80),
        ts: Date.now(),
        publicId,
        alias: alias || "Anónimo",
        hasReply: false,
      };
      const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
      const next = [entry, ...stored.filter((c) => c.chatId !== data.chatId)];
      localStorage.setItem("myChats", JSON.stringify(next));

      const list = next
        .filter((c) => c.publicId === publicId)
        .sort((a, b) => b.ts - a.ts);
      setLinks(list);

      setContent("");
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      alert("Error al enviar mensaje");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Tu alias (opcional)"
          value={alias}
          onChange={(e) => {
            setAlias(e.target.value);
            localStorage.setItem(`alias_${publicId}`, e.target.value);
          }}
          style={{ width: "100%", padding: "10px", marginBottom: 12 }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tu mensaje aquí..."
          style={{ width: "100%", height: 80, padding: 10 }}
        />
        <button type="submit" style={{ marginTop: 10 }}>
          Enviar mensaje
        </button>
      </form>

      {links.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>
            Tus chats abiertos ({links.length})
          </h3>
          <div style={{ display: "grid", gap: 8 }}>
            {links.map((c) => (
              <a
                key={c.chatId}
                href={c.chatUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 10,
                  textDecoration: "none",
                  color: "#111",
                  background: "#fafafa",
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  Chat con {c.alias || "Anónimo"}
                </div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                  {c.preview || "Mensaje inicial"}
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                  {new Date(c.ts).toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: c.hasReply ? "green" : "#999",
                    marginTop: 4,
                  }}
                >
                  {c.hasReply ? "¡Nueva respuesta!" : "Esperando respuesta"}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <p>¿Quieres recibir mensajes anónimos como este?</p>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#4CAF50",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Crea tu propio Dashboard
        </a>
      </div>
    </div>
  );
}
