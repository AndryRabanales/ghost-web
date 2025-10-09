"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // Importar useRouter
import { refreshToken } from "@/utils/auth";
import MessageList from "@/components/MessageList";
import DashboardInfo from "@/components/DashboardInfo";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function DashboardPage() {
  const { id } = useParams(); // dashboardId
  const router = useRouter(); // Inicializar el router
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = (token) => {
    const t = token || localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const handleAuthFailure = () => {
    localStorage.clear(); // Limpiar sesión inválida
    router.push("/login?session=expired"); // Redirigir al login
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
            headers: getAuthHeaders(newToken),
          });
        } else {
          // Si el refresco falla, la sesión es inválida
          handleAuthFailure();
          return;
        }
      }

      if (!res.ok) {
        // Si sigue sin funcionar, redirigir
        handleAuthFailure();
        return;
      };
      
      const data = await res.json();
      setCreator(data);
    } catch (err) {
      console.error("❌ Error en fetchCreator:", err);
      // Ante cualquier error de red o similar, también es prudente redirigir
      handleAuthFailure();
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
        <DashboardInfo
          creator={creator}
          dashboardId={id}
          onChange={(data) => setCreator(data)}
        />
      )}

      {/* chats */}
      <MessageList dashboardId={id} />
    </div>
  );
}