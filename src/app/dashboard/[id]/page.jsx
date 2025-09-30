"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MessageList from "@/components/MessageList";

export default function DashboardPage({ params }) {
  const { id: dashboardId } = params;
  const searchParams = useSearchParams();
  const [token, setToken] = useState(null);

  useEffect(() => {
    // 1️⃣ Intentar leer el token desde la URL
    const urlToken = searchParams.get("token");
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      setToken(urlToken);
      console.log("🔑 Token guardado en localStorage:", urlToken);
    } else {
      // 2️⃣ Si no viene en la URL, buscar en localStorage
      const saved = localStorage.getItem("token");
      if (saved) {
        setToken(saved);
        console.log("🔑 Token recuperado de localStorage:", saved);
      }
    }
  }, [searchParams]);

  if (!token) {
    return <p style={{ color: "red" }}>⚠️ No hay token válido, vuelve a iniciar sesión.</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>
      {/* ✅ Pasamos el token explícitamente a MessageList */}
      <MessageList dashboardId={dashboardId} initialToken={token} />
    </div>
  );
}
