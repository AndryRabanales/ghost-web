"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageList({ dashboardId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState(null);
  const [lives, setLives] = useState(null); // vidas actuales
  const [isPremium, setIsPremium] = useState(false); // premium o no
  const router = useRouter();

  // obtener chats y datos del creador
  const fetchChats = async () => {
    if (!dashboardId) return;
    try {
      const res = await fetch(`${API}/dashboard/${dashboardId}/chats`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setIsPremium(data[0].creator?.isPremium || false);
        setLives(data[0].creator?.lives ?? null);
      }

      const stored = JSON.parse(localStorage.getItem("myChats") || "[]");

      const enhanced = Array.isArray(data)
        ? data.map((c) => {
            const lastAnonMsg = c.messages?.find((m) => m.from === "anon");
            const foundLocal = stored.find((s) => s.chatId === c.id);
            const openedFlag = localStorage.getItem(`opened_${c.id}`) === "true";
            return {
              ...c,
              lastAnonId: lastAnonMsg?.id || null,
              anonAlias: foundLocal?.anonAlias || foundLocal?.alias || "Anónimo",
              alreadyOpened: openedFlag,
              openedNow: false, // flag temporal para mostrar aviso
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

  // marcar mensajes del anónimo como vistos
  const markSeen = async (chatId, messageId) => {
    try {
      await fetch(`${API}/chat-messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seen: true }),
      });
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId ? { ...m, seen: true } : m
                ),
                lastSeenAnonId: messageId,
              }
            : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // abrir mensaje (consume vida la primera vez si no es Premium)
  const handleOpenMessage = async (chat, messageId, aliasToShow) => {
    try {
      if (!isPremium && !chat.alreadyOpened) {
        const res = await fetch(
          `${API}/dashboard/${dashboardId}/open-message/${messageId}`,
          { method: "POST" }
        );
        if (res.status === 403) {
          const data = await res.json();
          alert(data.error); // Sin vidas
          return;
        }
        const data = await res.json();
        setLives(data.lives);
      }

      // marcar como visto y como "abierto"
      localStorage.setItem(`opened_${chat.id}`, "true");
      if (chat.messages?.[0]?.from === "anon" && !chat.messages?.[0]?.seen) {
        await markSeen(chat.id, chat.messages[0].id);
      }

      // actualizar estado → marcar openedNow para mostrar aviso
      setChats((prev) =>
        prev.map((c) =>
          c.id === chat.id
            ? {
                ...c,
                alreadyOpened: true,
                openedNow: true,
              }
            : c
        )
      );

      router.push(`/dashboard/${dashboardId}/chats/${chat.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Cargando…</p>;
  if (chats.length === 0) return <p>No hay chats aún.</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {!isPremium && lives !== null && (
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>
          Vidas disponibles: {lives}
        </div>
      )}

      {chats.map((chat) => {
        const last = chat.messages?.[0];
        const hasNewMsg =
          last?.from === "anon" && !last?.seen && !chat.alreadyOpened;

        const isOpen = openCard === chat.id;
        const firstAnonMessage = chat.messages?.find((m) => m.from === "anon");
        const aliasToShow = chat.anonAlias || "Anónimo";

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

                {/* nuevo aviso si fue abierto por primera vez */}
                {chat.openedNow && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#d9534f",
                      marginTop: 6,
                    }}
                  >
                    Este mensaje fue abierto. Se descontó una vida.
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
                    handleOpenMessage(chat, last?.id, aliasToShow)
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
