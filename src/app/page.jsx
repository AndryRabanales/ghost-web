// src/app/page.jsx (Versión Definitiva)
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dashboardUrl, setDashboardUrl] = useState(null);
  const [publicUrl, setPublicUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDashboardUrl(null);
    setPublicUrl(null);

    try {
      const res = await fetch(`${API}/creators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "Anónimo" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear tu dashboard");

      // Guardar datos en localStorage para la sesión
      localStorage.setItem("token", data.token);
      localStorage.setItem("publicId", data.publicId);

      // Construir los URLs completos para mostrarlos
      const frontendUrl = window.location.origin;
      const newDashboardUrl = `${frontendUrl}/dashboard/${data.dashboardId}`;
      const newPublicUrl = `${frontendUrl}/u/${data.publicId}`;
      
      setDashboardUrl(newDashboardUrl);
      setPublicUrl(newPublicUrl);

      // Redirigir automáticamente después de un momento
      setTimeout(() => {
        router.push(newDashboardUrl);
      }, 1500); // Espera 1.5 segundos antes de redirigir

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: 20, textAlign: 'center' }}>
      <h1>Recibe Mensajes Anónimos</h1>
      <p style={{color: '#666', marginBottom: '30px'}}>Crea tu link personal y compártelo donde quieras.</p>
      
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Escribe tu nombre (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: 12, marginBottom: 16, textAlign: 'center', fontSize: '16px' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: "12px 24px",
            fontSize: '18px',
            cursor: 'pointer',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          {loading ? "Generando..." : "✨ Generar mis Links"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: '15px' }}>{error}</p>}

      {dashboardUrl && (
        <div style={{ marginTop: 30, background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <p style={{fontWeight: 'bold'}}>¡Listo! Aquí están tus links:</p>
          <p>
            <strong>Tu dashboard (privado):</strong>{" "}
            <a href={dashboardUrl} style={{color: '#0070f3'}}>{dashboardUrl}</a>
          </p>
          <p>
            <strong>Tu link público (para compartir):</strong>{" "}
            <a href={publicUrl} style={{color: '#0070f3'}}>{publicUrl}</a>
          </p>
          <p style={{marginTop: '15px', color: '#666'}}>Serás redirigido a tu dashboard en un momento...</p>
        </div>
      )}

      <div style={{ marginTop: 40 }}>
        <a href="/login" style={{color: '#666', textDecoration: 'underline'}}>¿Ya tienes una cuenta? Inicia sesión</a>
        <span style={{margin: '0 10px', color: '#ccc'}}>|</span>
        <a href="/register" style={{color: '#666', textDecoration: 'underline'}}>Crear una cuenta</a>
      </div>
    </div>
  );
}