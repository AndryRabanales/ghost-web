"use client";
import React, { useEffect, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageForm({ publicId }) {
  const [content, setContent] = useState("");
  const [alias, setAlias] = useState("");
  const [links, setLinks] = useState([]);

  // Helpers
  const readStore = () =>
    JSON.parse(localStorage.getItem("myChats") || "[]");

  const writeStore = (arr) =>
    localStorage.setItem("myChats", JSON.stringify(arr));

  const refreshLinksFromStore = () => {
    const stored = readStore();
    const list = stored
      .filter((c) => c.publicId === publicId)
      .sort((a, b) => b.ts - a.ts);
    setLinks(list);
  };

  // Cargar alias + lista inicial
  useEffect(() => {
    const storedAlias = localStorage.getItem(`alias_${publicId}`);
    if (storedAlias) setAlias(storedAlias);
    refreshLinksFromStore();
  }, [publicId]);

  // Polling: detectar si hay NUEVOS mensajes del creador
  // hasReply = (lastCreatorId !== lastSeenCreatorId)
  useEffect(() => {
    const interval = setInterval(async () => {
      const stored = readStore();
      let updated = [...stored];

      // Recorremos solo chats de este publicId
      for (let i = 0; i < updated.length; i++) {
        const c = updated[i];
        if (c.publicId !== publicId) continue;

        try {
          const res = await fetch(`${API}/chats/${c.anonToken}/${c.chatId}`);
          const data = await res.json();

          const msgs = Array.isArray(data.messages) ? data.messages : [];
          // Buscar último mensaje del creador y tomar su id como "marker"
          let lastCreatorId = null;
          for (let k = msgs.length - 1; k >= 0; k--) {
            if (msgs[k].from === "creator") {
              lastCreatorId = msgs[k].id || String(k);
              break;
            }
          }

          // Guardamos el último marker del creador conocido
          updated[i].lastCreatorId = lastCreatorId;

          // hasReply solo si hay un "último del creador" distinto a lo último visto
          const lastSeen = updated[i].lastSeenCreatorId || null;
          updated[i].hasReply =
            lastCreatorId !== null && lastCreatorId !== lastSeen;
        } catch (err) {
          console.error("Error comprobando respuesta:", err);
        }
      }

      writeStore(updated);
      // Refrescamos solo esta vista
      const list = updated
        .filter((c) => c.publicId === publicId)
        .sort((a, b) => b.ts - a.ts);
      setLinks(list);
    }, 5000);
    return () => clearInterval(interval);
  }, [publicId]);

  // Al volver de otra pestaña (p. ej. del chat), refrescamos lista sin esperar al polling
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) refreshLinksFromStore();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [publicId]);

  // Marcar como "visto" INMEDIATO al hacer click en un chat de la lista
  const acknowledgeSeen = (entry) => {
    const stored = readStore();
    const next = stored.map((c) =>
      c.chatId === entry.chatId && c.anonToken === entry.anonToken
        ? {
            ...c,
            // si ya conocemos el último del creador, lo damos por visto
            lastSeenCreatorId:
              entry.lastCreatorId != null
                ? entry.lastCreatorId
                : c.lastCreatorId || c.lastSeenCreatorId || null,
            hasReply: false,
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
        // nuevos campos para lógica robusta:
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
                onClick={() => acknowledgeSeen(c)} // ← marcar visto al instante
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
