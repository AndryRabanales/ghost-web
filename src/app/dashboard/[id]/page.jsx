"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MessageList from "@/components/MessageList";

export default function DashboardPage({ params }) {
  const { id: dashboardId } = params;
  const searchParams = useSearchParams();
  const [initialToken, setInitialToken] = useState(null);

  // Guardar el token en localStorage si viene en la URL
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      setInitialToken(token);
      console.log("🔑 Token guardado en localStorage:", token);
    } else {
      // Si no viene en la URL, usar el de localStorage
      const stored = localStorage.getItem("token");
      if (stored) setInitialToken(stored);
    }
  }, [searchParams]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>
      {initialToken ? (
        <MessageList dashboardId={dashboardId} initialToken={initialToken} />
      ) : (
        <p style={{ color: "red" }}>⚠️ No hay token válido, vuelve a iniciar sesión.</p>
      )}
    </div>
  );
}
