"use client";
import { useEffect, useState } from "react";
import { refreshToken } from "@/utils/auth";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageList({ dashboardId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchChats = async () => {
    if (!dashboardId) return;
    try {
      let res = await fetch(`${API}/dashboard/${dashboardId}/chats`, {
        headers: getAuthHeaders(),
      });

      if (res.status === 401) {
        const publicId = localStorage.getItem("publicId");
        const newToken = await refreshToken(publicId);
        if (newToken) {
          res = await fetch(`${API}/dashboard/${dashboardId}/chats`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
        } else {
          console.error("No se pudo renovar el token");
          return;
        }
      }

      if (!res.ok) {
        console.error("⚠️ Error cargando chats:", res.status);
        return;
      }

      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error("Error en fetchChats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000); // 🔁 refresca cada 5s
    return () => clearInterval(interval);
  }, [dashboardId]);

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h2>Chats recibidos</h2>
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
                <a
                  href={`/dashboard/${dashboardId}/chats/${c.id}`}
                  style={{
                    display: "inline-block",
                    padding: "8px 14px",
                    background: "#4CAF50",
                    color: "#fff",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  Responder
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
