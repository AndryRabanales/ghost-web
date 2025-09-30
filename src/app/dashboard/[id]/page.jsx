"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MessageList from "@/components/MessageList";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

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
      const res = await fetch(`${API}/dashboard/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        console.error("⚠️ Error cargando dashboard:", res.status);
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
    if (id) fetchCreator();
  }, [id]);

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Dashboard</h1>
      {creator && (
        <div style={{ marginBottom: 20 }}>
          <p>
            <strong>Nombre:</strong> {creator.name}
          </p>
          <p>
            <strong>Dashboard ID:</strong> {id}
          </p>
        </div>
      )}

      {/* Lista de chats protegida con token */}
      <MessageList dashboardId={id} />
    </div>
  );
}
