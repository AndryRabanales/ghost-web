"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MessageList from "@/components/MessageList";
import { refreshToken } from "@/utils/auth";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function DashboardPage() {
  const { id } = useParams(); // dashboardId
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCreator = async () => {
    try {
      let res = await fetch(`${API}/creators/me`, {
        headers: getAuthHeaders(),
      });

      if (res.status === 401) {
        const publicId = localStorage.getItem("publicId");
        const newToken = await refreshToken(publicId);
        if (newToken) {
          res = await fetch(`${API}/creators/me`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
        } else {
          console.error("No se pudo renovar el token");
          return;
        }
      }

      if (!res.ok) {
        console.error("⚠️ Error cargando creator:", res.status);
        return;
      }

      const data = await res.json();
      setCreator(data);
    } catch (err) {
      console.error("Error en fetchCreator:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreator();
  }, []);

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Dashboard</h1>
      {creator && (
  <div style={{ marginBottom: 20 }}>
    <p><strong>Nombre:</strong> {creator.name}</p>
    <p><strong>Dashboard ID:</strong> {id}</p>

    {/* ❤️ mostrar vidas */}
    <p>
      ❤️ Vidas restantes: {creator.lives} <br />
      ⏳ Próxima vida en: {creator.minutesToNextLife} min
    </p>
  </div>
)}


      {/* Lista de chats protegida con token */}
      <MessageList dashboardId={id} />
    </div>
  );
}
