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
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [inviteCode, setInviteCode] = useState(""); // <--- Nuevo estado para código
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      const guestToken = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (guestToken) {
        headers["Authorization"] = `Bearer ${guestToken}`;
      }

      // Enviamos inviteCode en el body
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ name, email, password, inviteCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al crear la cuenta");
      }

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
    <div className="auth-container">
      <main className="auth-card">
        <h1>Crear Cuenta</h1>
        <form onSubmit={handleRegister} className="auth-form">
          <input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="auth-input"
          />
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
            placeholder="Crea una contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="auth-input"
          />
          
          {/* --- CAMPO DE CÓDIGO DE INVITACIÓN --- */}
          <input
            type="text"
            placeholder="Código de Invitación (Requerido)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
            className="auth-input"
            style={{
                borderColor: '#8e2de2', 
                borderWidth: '2px',
                textAlign: 'center',
                fontWeight: 'bold',
                letterSpacing: '1px'
            }}
          />
          {/* --- FIN CAMPO --- */}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Creando..." : "Registrarse"}
          </button>
          {error && <p className="auth-error">{error}</p>}
        </form>
        <p className="auth-footer-link">
          ¿Ya tienes una cuenta? <a href="/">Inicia sesión</a>
        </p>
      </main>
    </div>
  );
}