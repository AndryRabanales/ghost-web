"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import MessageList from "@/components/MessageList";

export default function DashboardPage({ params }) {
  const { id: dashboardId } = params;
  const searchParams = useSearchParams();

  // Guardar el token en localStorage si viene en la URL
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      console.log("🔑 Token guardado en localStorage:", token);
    }
  }, [searchParams]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>
      <MessageList dashboardId={dashboardId} />
    </div>
  );
}
