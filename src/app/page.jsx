"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SubscribeButton from "@/components/SubscribeButton";


const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dashboardUrl, setDashboardUrl] = useState(null);
  const [publicUrl, setPublicUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API}/creators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando dashboard");

      // 👉 Guardar token y publicId en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("publicId", data.publicId);

      // 👉 Mostrar links en pantalla
      setDashboardUrl(data.dashboardUrl);
      setPublicUrl(data.publicUrl);

      // 👉 Redirigir al dashboard automáticamente
    } catch (err) {
      console.error("❌ Error creando dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Crear mi Dashboard</h1>
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Tu nombre para el chat"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Creando..." : "Generar Dashboard"}
        </button>
      </form>

      {dashboardUrl && (
  <div style={{ marginTop: 20 }}>
    <p>
      <strong>Tu dashboard (privado):</strong>{" "}
      <a href={dashboardUrl}>{dashboardUrl}</a>
    </p>
    <p>
      <strong>Tu link público para recibir mensajes:</strong>{" "}
      <a href={publicUrl}>{publicUrl}</a>
    </p>

    {/* 👇 Aquí agregamos el botón premium */}
    <div style={{ marginTop: 30 }}>
      <h3>¿Quieres vidas ilimitadas?</h3>
      <SubscribeButton />
    </div>
  </div>
)}

    </div>
  );
}
