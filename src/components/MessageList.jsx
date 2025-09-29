"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageList({ dashboardId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState(null);
  const router = useRouter();

  const fetchChats = async () => {
    if (!dashboardId) return;
    try {
      const res = await fetch(`${API}/dashboard/${dashboardId}/chats`);
      const data = await res.json();
      // añadimos markers para último del anónimo
      const enhanced = Array.isArray(data)
        ? data.map((c) => {
            const lastAnonMsg = c.messages?.find((m) => m.from === "anon");
            return {
              ...c,
              lastAnonId: lastAnonMsg?.id || null,
            };
          })
        : [];
      setChats(enhanced);
    } catch (err) {
      console.error(err);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    const int = setInterval(fetchChats, 5000);
    return () => clearInterval(int);
  }, [dashboardId]);

  // marcar mensajes del anónimo como vistos al abrir card
  const markSeen = async (chatId, messageId) => {
    try {
      await fetch(`${API}/chat-messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seen: true }),
      });
      // actualiza estado local
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId ? { ...m, seen: true } : m
                ),
                // al verlo, marcamos también lastSeenAnonId para apagar badge
                lastSeenAnonId: messageId,
              }
            : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Cargando…</p>;
  if (chats.length === 0) return <p>No hay chats aún.</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {chats.map((chat) => {
        const last = chat.messages?.[0];
        // hasNewMsg: hay mensaje del anónimo no visto
        const hasNewMsg =
          last?.from === "anon" && !last?.seen ? true : false;

        const isOpen = openCard === chat.id;

        const firstAnonMessage = chat.messages?.find(
          (m) => m.from === "anon"
        );

        const aliasToShow =
          last?.from === "anon" && last?.alias
            ? last.alias
            : "Anónimo";

        const handleCardClick = async (e) => {
          if (e.target.tagName === "BUTTON") return;

          if (!isOpen) {
            setOpenCard(chat.id);
            if (last?.from === "anon" && !last?.seen) {
              await markSeen(chat.id, last.id);
            }
          } else {
            setOpenCard(null);
          }
        };

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
                : hasNewMsg
                ? "#ffe6e6"
                : "#e6e6e6",
              textDecoration: "none",
              color: "#111",
              cursor: "pointer",
            }}
          >
            {isOpen ? (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  <span>Alias: {aliasToShow}</span>
                  {/* badge si hay mensaje nuevo */}
                  {hasNewMsg && (
                    <span style={{ color: "red", fontSize: 12 }}>
                      ● Mensaje nuevo
                    </span>
                  )}
                </div>

                <div style={{ color: "#444", marginBottom: 6 }}>
                  {firstAnonMessage?.content || "Sin mensaje del anónimo"}
                </div>
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  <span>{hasNewMsg ? "Sin leer" : "Leído"}</span>
                  {hasNewMsg && (
                    <span style={{ color: "red", fontSize: 12 }}>
                      ● Mensaje nuevo
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {hasNewMsg
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
