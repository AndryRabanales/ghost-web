"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MessageList from "@/components/MessageList";

export default function DashboardPage({ params }) {
  const { id: dashboardId } = params;
  const searchParams = useSearchParams();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      setToken(urlToken);
      console.log("🔑 Token guardado en localStorage:", urlToken);
    } else {
      // intentar leer de localStorage si no vino en la URL
      const saved = localStorage.getItem("token");
      if (saved) setToken(saved);
    }
  }, [searchParams]);

  if (!token) {
    return <p style={{ color: "red" }}>⚠️ No hay token válido, vuelve a iniciar sesión.</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>
      {/* ✅ Ahora pasamos el token explícitamente */}
      <MessageList dashboardId={dashboardId} initialToken={token} />
    </div>
  );
}
