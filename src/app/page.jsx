// src/app/page.jsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateGuest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Esta es la llamada para crear un usuario "invitado" o anónimo
      const res = await fetch(`${API}/creators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "Anónimo" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear tu link");

      // Guardar los datos de la sesión temporal en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("publicId", data.publicId);

      // Redirigir automáticamente al nuevo dashboard
      router.push(`/dashboard/${data.dashboardId}`);

    } catch (err) {
      // 👇 BLOQUE CORREGIDO CON LLAVES 👇
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: 20, textAlign: 'center' }}>
      <h1>Recibe Mensajes Anónimos</h1>
      <p style={{color: '#666', marginBottom: '30px'}}>Crea tu link personal y compártelo donde quieras.</p>
      
      <form onSubmit={handleCreateGuest}>
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
          {loading ? "Generando..." : "✨ Generar mi Link Mágico"}
        </button>
        {error && <p style={{ color: "red", marginTop: '10px' }}>{error}</p>}
      </form>

      <div style={{ marginTop: 40 }}>
        <a href="/login" style={{color: '#666', textDecoration: 'underline'}}>¿Ya tienes una cuenta? Inicia sesión</a>
      </div>
    </div>
  );
}