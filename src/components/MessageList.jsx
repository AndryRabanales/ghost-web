"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageList({ dashboardId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState(null);
  const [aliasMap, setAliasMap] = useState({});
  const router = useRouter();

  const fetchChats = async () => {
    if (!dashboardId) return;
    try {
      const res = await fetch(`${API}/dashboard/${dashboardId}/chats`);
      const data = await res.json();
      setChats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [dashboardId]);

  // Polling automático cada 5s para ver nuevos mensajes
  useEffect(() => {
    const int = setInterval(fetchChats, 5000);
    return () => clearInterval(int);
  }, [dashboardId]);

  const markSeen = async (messageId) => {
    try {
      await fetch(`${API}/chat-messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seen: true }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAliasAndMaybeMark = async (chatId, markLastAnonUnseen = false) => {
    try {
      const res = await fetch(`${API}/dashboard/chats/${chatId}`);
      const data = await res.json();
      const aliasMsg = data?.messages?.find(
        (m) => m.from === "anon" && m.alias
      );
      const alias = aliasMsg?.alias || "Anónimo";
      setAliasMap((prev) => ({ ...prev, [chatId]: alias }));

      if (markLastAnonUnseen) {
        const lastAnonUnseen = [...(data?.messages || [])]
          .filter((m) => m.from === "anon" && !m.seen)
          .pop();
        if (lastAnonUnseen?.id) await markSeen(lastAnonUnseen.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <p>Cargando…</p>;
  if (chats.length === 0) return <p>No hay chats aún.</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {chats.map((chat) => {
        const last = chat.messages?.[0];
        // “Sin leer” solo si el último es del anónimo y no está visto
        const unread = last?.from === "anon" ? !last?.seen : false;
        const isOpen = openCard === chat.id;

        // mensaje inicial del anónimo
        const firstAnonMessage = chat.messages?.find(
          (m) => m.from === "anon"
        );

        const handleCardClick = async (e) => {
          if (e.target.tagName === "BUTTON") return;

          if (!isOpen) {
            setOpenCard(chat.id);
            if (last?.from === "anon") {
              if (!last?.seen && last?.id) await markSeen(last.id);
            } else {
              await fetchAliasAndMaybeMark(chat.id, true);
            }
          } else {
            setOpenCard(null);
          }
        };

        const aliasToShow =
          isOpen
            ? (last?.from === "anon" && last?.alias) ||
              aliasMap[chat.id] ||
              "Anónimo"
            : undefined;

        return (
          <div
            key={chat.id}
            onClick={handleCardClick}
            style={{
              display: "block",
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: isOpen
                ? "#ffffff"
                : unread
                ? "#ffe6e6"
                : "#e6e6e6",
              textDecoration: "none",
              color: "#111",
              cursor: "pointer",
            }}
          >
            {isOpen ? (
              <>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Alias: {aliasToShow}
                </div>

                {/* Mensaje inicial del anónimo */}
                <div style={{ color: "#444", marginBottom: 6 }}>
                  {firstAnonMessage?.content || "Sin mensaje del anónimo"}
                </div>

                {/* Si el último es del creador, mostrar aviso */}
                {last?.from === "creator" && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#777",
                      marginBottom: 6,
                    }}
                  >
                    Último mensaje enviado por ti. Abre el chat para ver la
                    conversación completa.
                  </div>
                )}

                <button
                  style={{
                    marginTop: 10,
                    padding: "6px 10px",
                    background: "#0070f3",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    router.push(`/dashboard/${dashboardId}/chats/${chat.id}`)
                  }
                >
                  Responder a {aliasToShow}
                </button>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {unread ? "Sin leer" : "Leído"}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {unread
                    ? "Mensaje bloqueado, haz click para ver"
                    : "Mensaje oculto (Leído). Haz click para desplegar"}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
