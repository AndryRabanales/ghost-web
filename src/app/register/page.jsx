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
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al crear la cuenta");
      }

      // Guardar datos y redirigir al dashboard
      localStorage.setItem("token", data.token);
      localStorage.setItem("publicId", data.publicId);
      
      // La API ahora debería devolver el dashboardId (que es el creator.id)
      // Si no, necesitamos ajustar la API o la redirección. Asumamos que sí lo tenemos.
      const creatorId = JSON.parse(atob(data.token.split('.')[1])).id;
      router.push(`/dashboard/${creatorId}`);

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