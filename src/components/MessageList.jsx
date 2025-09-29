"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageList({ dashboardId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState(null);
  const [lives, setLives] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const router = useRouter();

  // Candado para que el polling no sobrescriba el valor local recién actualizado
  const livesLockRef = useRef(0);

  const fetchChats = async () => {
    if (!dashboardId) return;
    try {
      const res = await fetch(`${API}/dashboard/${dashboardId}/chats`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setIsPremium(data[0].creator?.isPremium || false);

        const newLives = data[0].creator?.lives ?? null;
        // Solo permitir que el polling actualice 'lives' si no hay candado activo
        setLives((prev) =>
          typeof newLives === "number" && Date.now() >= livesLockRef.current
            ? newLives
            : prev
        );
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
              anonAlias:
                foundLocal?.anonAlias || foundLocal?.alias || "Anónimo",
              alreadyOpened: openedFlag,
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

  // abrir mensaje (consume vida solo si es anon + no visto)
  const handleOpenMessage = async (chat) => {
    try {
      const last = chat.messages?.[0];
  
      // 🔴 ya no comprobamos shouldCharge aquí, dejamos que el server decida
      const res = await fetch(
        `${API}/dashboard/${dashboardId}/open-message/${last.id}`,
        { method: "POST" }
      );
  
      if (res.status === 403) {
        const data = await res.json();
        alert(data.error);
        return;
      }
  
      const json = await res.json();
      if (typeof json.lives === "number") {
        setLives(json.lives);
      } else {
        setLives((prev) =>
          typeof prev === "number" ? Math.max(0, prev - 1) : prev
        );
      }
  
      // Bloquea el polling un momento
      livesLockRef.current = Date.now() + 3000;
  
      // reflejar visto en UI inmediatamente
      if (last?.from === "anon" && !last?.seen) {
        await markSeen(chat.id, last.id);
      }
  
      // Marcar tarjeta como abierta (UI)
      localStorage.setItem(`opened_${chat.id}`, "true");
      setChats((prev) =>
        prev.map((c) => (c.id === chat.id ? { ...c, alreadyOpened: true } : c))
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

                {chat.alreadyOpened && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#d9534f",
                      marginTop: 6,
                    }}
                  >
                    Este mensaje ya fue abierto y se descontó una vida.
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
                  onClick={() => handleOpenMessage(chat)}
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
