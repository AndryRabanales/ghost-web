// src/app/login/page.jsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://api.ghostmsg.space";

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

      localStorage.setItem("token", data.token);
      localStorage.setItem("publicId", data.publicId);

      if (data.dashboardId) {
        router.push(`/dashboard/${data.dashboardId}`);
      } else {
        setError("No se pudo obtener el ID del dashboard para la redirección.");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <main className="auth-card">
        <h1>Iniciar Sesión</h1>
        <form onSubmit={handleLogin} className="auth-form">
          <input
            type="email"
            placeholder="Tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Ingresando..." : "Entrar"}
          </button>
          {error && <p className="auth-error">{error}</p>}
        </form>
        <p className="auth-footer-link">
          ¿No tienes una cuenta? <a href="/register">Regístrate ahora</a>
        </p>
      </main>
    </div>
  );
}