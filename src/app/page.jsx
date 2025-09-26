"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "http://localhost:3001";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dashboardUrl, setDashboardUrl] = useState(null);
  const [publicUrl, setPublicUrl] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/creators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando dashboard");
      setDashboardUrl(data.dashboardUrl);
      setPublicUrl(data.publicUrl);
      // redirigir automáticamente al dashboard privado
      //router.push(data.dashboardUrl);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Crear mi Dashboard</h1>
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Tu nombre (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
          }}
        >
          Generar Dashboard
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
        </div>
      )}
    </div>
  );
}
