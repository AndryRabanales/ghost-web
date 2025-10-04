"use client";
import { useState, useEffect } from "react";
import { refreshToken, getAuthHeaders } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function PremiumButton({ onChange }) {
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Función para obtener el estado actual del creador (si es premium o no)
  const fetchCreatorStatus = async () => {
    try {
      let res = await fetch(`${API}/creators/me`, { headers: getAuthHeaders() });

      if (res.status === 401) {
        const publicId = localStorage.getItem("publicId");
        if (publicId) {
          const newToken = await refreshToken(publicId);
          if (newToken) {
            res = await fetch(`${API}/creators/me`, { headers: getAuthHeaders(newToken) });
          }
        }
      }

      if (!res.ok) throw new Error("No se pudo cargar el estado del creador");
      
      const data = await res.json();
      setIsPremium(data.isPremium || false);

      // Notifica a la página principal (Dashboard) sobre cualquier cambio en el creador
      if (onChange) onChange(data);

    } catch (err) {
      console.error("❌ Error en fetchCreatorStatus:", err);
    }
  };

  // --- ¡ESTA ES LA LÓGICA DE PRUEBA! ---
  // Activa o desactiva el modo premium llamando a las rutas "dummy" del backend.
  const togglePremium = async () => {
    setLoading(true);
    try {
      // Decide a qué ruta llamar dependiendo de si el usuario ya es premium o no
      const endpoint = isPremium ? `${API}/premium/deactivate` : `${API}/premium/activate`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar el estado premium");

      // Después de cambiar el estado, volvemos a pedir los datos del usuario para actualizar la UI
      await fetchCreatorStatus();

    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Carga el estado del usuario cuando el componente se monta
  useEffect(() => {
    fetchCreatorStatus();
  }, []);

  return (
    <div style={{ marginBottom: 16, border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
      <p style={{marginTop: 0}}>
        {isPremium 
          ? "⭐ Premium de prueba activo." 
          : "Usa este botón para probar el modo Premium."}
      </p>
      
      <button
        onClick={togglePremium}
        disabled={loading}
        style={{
          padding: "10px 20px",
          borderRadius: 6,
          border: "none",
          background: isPremium ? '#e74c3c' : '#2ecc71', // Rojo para desactivar, Verde para activar
          color: "#fff",
          cursor: loading ? "wait" : "pointer",
          fontWeight: 'bold',
          width: '100%'
        }}
      >
        {loading
          ? "Cambiando estado..."
          : isPremium
          ? "Desactivar Premium (Prueba)"
          : "Activar Premium (Prueba)"}
      </button>
    </div>
  );
}