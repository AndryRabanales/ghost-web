"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function CreatorChatsPage() {
  const { id } = useParams(); // creatorId (dashboardId)
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("⚠️ No hay token en localStorage");
        setChats([]);
        return;
      }

      const res = await fetch(`${API}/dashboard/${id}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("⚠️ Error al cargar chats:", res.status);
        setChats([]);
        return;
      }

      const data = await res.json();
      setChats(data);
    } catch (e) {
      console.error("Error en fetchChats:", e);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchChats();
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
            const last = c.messages?.[0];
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
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Chat</div>
                <div style={{ color: "#444" }}>
                  {last ? last.content.slice(0, 80) : "Sin mensajes"}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
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
