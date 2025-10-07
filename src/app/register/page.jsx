// src/app/register/page.jsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ---- ✨ LÓGICA DE ENVÍO DE TOKEN DE INVITADO ✨ ----
      const guestToken = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (guestToken) {
        headers["Authorization"] = `Bearer ${guestToken}`;
      }
      // ----------------------------------------------------

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: headers, // Usamos los headers que preparamos
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al crear la cuenta");
      }

      // Limpiamos cualquier dato viejo y guardamos la nueva sesión permanente
      localStorage.clear(); 
      localStorage.setItem("token", data.token);
      localStorage.setItem("publicId", data.publicId);
      
      if (data.dashboardId) {
        router.push(`/dashboard/${data.dashboardId}`);
      } else {
        setError("Error: No se recibió el ID del dashboard.");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 20 }}>
      <h1>Crear una cuenta</h1>
      <form onSubmit={handleRegister} style={{ display: "grid", gap: 16 }}>
        <input
          type="text"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: 10 }}
        />
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
          {loading ? "Creando..." : "Registrarse"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
       <p style={{marginTop: '20px', textAlign: 'center'}}>
          ¿Ya tienes una cuenta? <a href="/login">Inicia sesión</a>
      </p>
    </div>
  );
}