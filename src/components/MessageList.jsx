"use client";
import { useEffect, useState } from "react";
import { refreshToken } from "@/utils/auth";
import { useRouter } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function MessageList({ dashboardId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [livesLeft, setLivesLeft] = useState(null);
  const [minutesNext, setMinutesNext] = useState(null);
  const [error, setError] = useState(null);

  const router = useRouter();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 🔹 obtener datos de vidas y chats
  const fetchData = async () => {
    if (!dashboardId) return;
    try {
      // 1️⃣ traer info del creador (vidas)
      let me = await fetch(`${API}/creators/me`, {
        headers: getAuthHeaders(),
      });

      if (me.status === 401) {
        const publicId = localStorage.getItem("publicId");
        const newToken = await refreshToken(publicId);
        if (newToken) {
          me = await fetch(`${API}/creators/me`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
        }
      }

      if (me.ok) {
        const meData = await me.json();
        setLivesLeft(meData.lives);
        setMinutesNext(meData.minutesToNextLife);
      }

      // 2️⃣ traer chats
      let res = await fetch(`${API}/dashboard/${dashboardId}/chats`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Error cargando chats");
      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error("Error en fetchData:", err);
      setError("⚠️ Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

 // 1️⃣ cargar valores guardados antes que nada
useEffect(() => {
  const storedLives = localStorage.getItem("livesLeft");
  const storedNext = localStorage.getItem("minutesNext");
  if (storedLives) setLivesLeft(parseInt(storedLives, 10));
  if (storedNext) setMinutesNext(parseInt(storedNext, 10));
}, []);

// 2️⃣ fetch al backend
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval);
}, [dashboardId]);

  
  useEffect(() => {
    if (livesLeft !== null) localStorage.setItem("livesLeft", livesLeft);
    if (minutesNext !== null) localStorage.setItem("minutesNext", minutesNext);
  }, [livesLeft, minutesNext]);
  

  // 🔹 cuando se hace click en "Responder"
  const handleOpenChat = async (chatId) => {
    try {
      let res = await fetch(
        `${API}/dashboard/${dashboardId}/chats/${chatId}/open`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      if (res.status === 401) {
        const publicId = localStorage.getItem("publicId");
        const newToken = await refreshToken(publicId);
        if (newToken) {
          res = await fetch(
            `${API}/dashboard/${dashboardId}/chats/${chatId}/open`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${newToken}` },
            }
          );
        }
      }

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "No se pudo abrir el chat");
        setLivesLeft(data.livesLeft ?? livesLeft);
        setMinutesNext(data.minutesToNextLife ?? minutesNext);
        return;
      }

      // ✅ actualizar contador
      setLivesLeft(data.livesLeft);
      setMinutesNext(data.minutesToNextLife);

      // ✅ redirigir al chat
      router.push(`/dashboard/${dashboardId}/chats/${chatId}`);
    } catch (err) {
      console.error("Error al abrir chat:", err);
      alert("⚠️ Error al abrir chat");
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h2>Chats recibidos</h2>

      {/* ❤️ contador de vidas global */}
      {livesLeft !== null && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: "#f9f9f9",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          ❤️ Vidas restantes: <strong>{livesLeft}</strong>
          <br />
          ⏳ Próxima vida en:{" "}
          <strong>{minutesNext === 0 ? "Disponible" : `${minutesNext} min`}</strong>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {chats.length === 0 ? (
        <p>No hay chats aún.</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {chats.map((c) => {
            const last = c.lastMessage;
            return (
              <div
                key={c.id}
                style={{
                  padding: 16,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  background: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              >
                {/* Alias */}
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  {c.anonAlias || "Anónimo"}
                </div>

                {/* Preview mensaje */}
                <div style={{ color: "#444", marginBottom: 6 }}>
                  {last ? last.content.slice(0, 80) : "Sin mensajes"}
                </div>

                {/* Fecha */}
                <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>
                  {last ? new Date(last.createdAt).toLocaleString() : ""}
                </div>

                {/* Botón responder */}
                <button
                  onClick={() => handleOpenChat(c.id)}
                  disabled={livesLeft === 0}
                  style={{
                    display: "inline-block",
                    padding: "8px 14px",
                    background: livesLeft === 0 ? "#999" : "#4CAF50",
                    color: "#fff",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    border: "none",
                    cursor: livesLeft === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {livesLeft === 0
                    ? `Sin vidas ⏳ (${minutesNext} min)`
                    : "Responder"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
