"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageList({ dashboardId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [lives, setLives] = useState(null);

  // nuevo: cooldown real desde backend
  const [timeLeft, setTimeLeft] = useState(null);

  const router = useRouter();
  const openingRef = useRef(new Set());

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
    return () => {
      clearInterval(int);
      openingRef.current.clear();
    };
  }, [dashboardId]);

  // manejar apertura de mensaje
  const handleOpenMessage = async (chat) => {
    const last = chat.messages?.[0];
    if (!last || last.from !== "anon") return;

    const messageId = last.id;

    if (openingRef.current.has(messageId)) return;
    openingRef.current.add(messageId);

    try {
      const res = await fetch(
        `${API}/dashboard/${dashboardId}/open-message/${messageId}`,
        { method: "POST" }
      );

      const json = await res.json();

      if (res.status === 403) {
        alert(json.error);
        if (json.minutesToNext) {
          setTimeLeft(json.minutesToNext * 60); // en segundos
        }
        return;
      }

      if (typeof json.lives === "number") {
        setLives(json.lives);
      }

      if (json.minutesToNext) {
        setTimeLeft(json.minutesToNext * 60);
      }

      setChats((prev) =>
        prev.map((c) =>
          c.id === chat.id
            ? {
                ...c,
                alreadyOpened: true,
                messages: c.messages?.length
                  ? [{ ...c.messages[0], seen: true }, ...c.messages.slice(1)]
                  : c.messages,
              }
            : c
        )
      );

      localStorage.setItem(`opened_${chat.id}`, "true");
      router.push(`/dashboard/${dashboardId}/chats/${chat.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      openingRef.current.delete(messageId);
    }
  };

  // contador visual cada segundo
  useEffect(() => {
    if (!timeLeft) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(interval);
          setLives(1); // el backend ya recarga, pero visualmente mostramos 1
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) return <p>Cargando…</p>;
  if (chats.length === 0) return <p>No hay chats aún.</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {!isPremium && lives <= 0 && timeLeft && (
        <div
          style={{
            fontWeight: "bold",
            marginBottom: 8,
            color: "#d9534f",
            fontSize: 14,
          }}
        >
          ⚡ Puedes responder un nuevo en {formatTime(timeLeft)}.
        </div>
      )}

      {chats.map((chat) => {
        const last = chat.messages?.[0];
        const hasNewMsg =
          last?.from === "anon" && !last?.seen && !chat.alreadyOpened;

        const isOpen = openCard === chat.id;
        const firstAnonMessage = chat.messages?.find((m) => m.from === "anon");
        const aliasToShow = chat.anonAlias || "Anónimo";

        const handleCardClick = (e) => {
          if (e.target.tagName === "BUTTON") return;
          setOpenCard(isOpen ? null : chat.id);
        };

        const isDisabled =
          lives <= 0 || chat.alreadyOpened || openingRef.current.has(last?.id);

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
                  disabled={isDisabled}
                  style={{
                    marginTop: 10,
                    padding: "6px 10px",
                    background: isDisabled ? "#ccc" : "#0070f3",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.6 : 1,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenMessage(chat);
                  }}
                >
                  {chat.alreadyOpened
                    ? "Ir al chat"
                    : isDisabled
                    ? "Esperando vida..."
                    : `Responder a ${aliasToShow}`}
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
