"use client";
import React, { useEffect, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageForm({ publicId }) {
  const [content, setContent] = useState("");
  const [alias, setAlias] = useState("");
  const [links, setLinks] = useState([]);

  const readStore = () =>
    JSON.parse(localStorage.getItem("myChats") || "[]");
  const writeStore = (arr) =>
    localStorage.setItem("myChats", JSON.stringify(arr));
  const refreshLinks = () => {
    const stored = readStore();
    const list = stored
      .filter((c) => c.publicId === publicId)
      .sort((a, b) => b.ts - a.ts);
    setLinks(list);
  };

  // cargar alias + lista inicial
  useEffect(() => {
    const storedAlias = localStorage.getItem(`alias_${publicId}`);
    if (storedAlias) setAlias(storedAlias);
    refreshLinks();
  }, [publicId]);

  // polling: detectar mensajes nuevos del creador
  useEffect(() => {
    const interval = setInterval(async () => {
      const stored = readStore();
      let updated = [...stored];

      for (let i = 0; i < updated.length; i++) {
        const c = updated[i];
        if (c.publicId !== publicId) continue;
        try {
          const res = await fetch(`${API}/chats/${c.anonToken}/${c.chatId}`);
          const data = await res.json();
          const msgs = Array.isArray(data.messages) ? data.messages : [];
          let lastCreatorId = null;
          for (let k = msgs.length - 1; k >= 0; k--) {
            if (msgs[k].from === "creator") {
              lastCreatorId = msgs[k].id || String(k);
              break;
            }
          }
          updated[i].lastCreatorId = lastCreatorId;
          const lastSeen = updated[i].lastSeenCreatorId || null;
          updated[i].hasReply =
            lastCreatorId !== null && lastCreatorId !== lastSeen;
        } catch (err) {
          console.error("Error comprobando respuesta:", err);
        }
      }

      writeStore(updated);
      const list = updated
        .filter((c) => c.publicId === publicId)
        .sort((a, b) => b.ts - a.ts);
      setLinks(list);
    }, 5000);
    return () => clearInterval(interval);
  }, [publicId]);

  // refrescar lista al volver del chat sin esperar polling
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) refreshLinks();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [publicId]);

  // marcar visto inmediato al hacer click en chat
  const acknowledgeSeen = (entry) => {
    const stored = readStore();
    const next = stored.map((c) =>
      c.chatId === entry.chatId && c.anonToken === entry.anonToken
        ? {
            ...c,
            lastSeenCreatorId:
              entry.lastCreatorId != null
                ? entry.lastCreatorId
                : c.lastCreatorId || c.lastSeenCreatorId || null,
            hasReply: false,
            anonAlias: c.anonAlias, // preservamos alias original
          }
        : c
    );
    writeStore(next);
    const list = next
      .filter((c) => c.publicId === publicId)
      .sort((a, b) => b.ts - a.ts);
    setLinks(list);
  };

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
        anonAlias: alias || "Anónimo", // 🚀 guardamos alias original aquí
        hasReply: false,
        lastCreatorId: null,
        lastSeenCreatorId: null,
      };
      const stored = readStore();
      const next = [entry, ...stored.filter((c) => c.chatId !== data.chatId)];
      writeStore(next);
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
                onClick={() => acknowledgeSeen(c)}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 10,
                  textDecoration: "none",
                  color: "#111",
                  background: "#fafafa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 600,
                  }}
                >
                  <span>Chat con {c.anonAlias || c.alias || "Anónimo"}</span>
                  {c.hasReply && (
                    <span style={{ color: "red", fontSize: 12 }}>
                      ● Nueva respuesta
                    </span>
                  )}
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
