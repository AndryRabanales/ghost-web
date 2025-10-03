"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { refreshToken } from "@/utils/auth"; // 👈 asegúrate de tener este archivo

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function CreatorChatsPage() {
  const { id } = useParams(); // creatorId (dashboardId)
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchChats = async () => {
    try {
      let res = await fetch(`${API}/dashboard/${id}/chats`, {
        headers: getAuthHeaders(),
      });

      // ⚠️ Si el token expiró → intentar refresh
      if (res.status === 401) {
        const publicId = localStorage.getItem("publicId");
        if (publicId) {
          const newToken = await refreshToken(publicId);
          if (newToken) {
            res = await fetch(`${API}/dashboard/${id}/chats`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
          }
        }
      }

      if (!res.ok) throw new Error("Error al obtener chats");

      const data = await res.json();
      setChats(data);
    } catch (e) {
      console.error("⚠️ Error cargando chats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchChats();
      const interval = setInterval(fetchChats, 5000); // 🔁 cada 5s
      return () => clearInterval(interval);
    }
  }, [id]);

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Chats del dashboard</h1>
      {chats.length === 0 ? (
        <p>No hay chats aún.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {chats.map((c) => {
            const last = c.lastMessage;
            return (
              <a
                key={c.id}
                href={`/dashboard/${id}/chats/${c.id}`}
                style={{
                  display: "block",
                  padding: 12,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  background: "#fafafa",
                  textDecoration: "none",
                  color: "#111",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {c.anonAlias || "Anónimo"}
                </div>
                <div style={{ color: "#444" }}>
                  {last ? last.content.slice(0, 80) : "Sin mensajes"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#888",
                    marginTop: 6,
                  }}
                >
                  {last ? new Date(last.createdAt).toLocaleString() : ""}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
