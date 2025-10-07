// src/app/login/page.jsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      // --- CAMBIO CLAVE ---
      // Guardar datos y usar el dashboardId que devuelve la API para redirigir
      localStorage.setItem("token", data.token);
      localStorage.setItem("publicId", data.publicId);
      
      // La API ahora devuelve el dashboardId directamente
      if (data.dashboardId) {
        router.push(`/dashboard/${data.dashboardId}`);
      } else {
        // Fallback por si la API no devuelve el dashboardId (aunque debería)
        const creatorId = JSON.parse(atob(data.token.split('.')[1])).id;
        router.push(`/dashboard/${creatorId}`);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 20 }}>
      <h1>Iniciar Sesión</h1>
      <form onSubmit={handleLogin} style={{ display: "grid", gap: 16 }}>
        <input
          type="email"
          placeholder="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10 }}
        />
        <input
          type="password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10 }}
        />
        <button type="submit" disabled={loading} style={{ padding: 12, cursor: 'pointer' }}>
          {loading ? "Ingresando..." : "Iniciar Sesión"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
      <p style={{marginTop: '20px', textAlign: 'center'}}>
          ¿No tienes una cuenta? <a href="/register">Regístrate</a>
      </p>
    </div>
  );
}