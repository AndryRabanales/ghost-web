// src/app/page.jsx (Versión corregida con fondo y tema morado)
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Componentes de Íconos Animados ---
const LoadingSpinner = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
    <style>{`.spinner_V8m1{transform-origin:center;animation:spinner_zKoa 2s linear infinite}.spinner_V8m1 circle{stroke-linecap:round;animation:spinner_YpZS 1.5s ease-in-out infinite}@keyframes spinner_zKoa{100%{transform:rotate(360deg)}}@keyframes spinner_YpZS{0%{stroke-dasharray:0 150;stroke-dashoffset:0}47.5%{stroke-dasharray:42 150;stroke-dashoffset:-16}95%,100%{stroke-dasharray:42 150;stroke-dashoffset:-59}}`}</style>
    <g className="spinner_V8m1"><circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="3" stroke="currentColor"></circle></g>
  </svg>
);

// --- Componente Principal de la Página de Inicio ---
export default function Home() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const handleCreateAndRedirect = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/creators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "Anónimo" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear tu espacio");
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("publicId", data.publicId);
      router.push(`/dashboard/${data.dashboardId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  const colors = useMemo(() => ({
    primary: '#8e2de2',
    secondary: '#4a00e0',
    darkBg: '#0d0c22',
    cardBg: '#1a1a2e',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(235, 235, 245, 0.6)',
    inputBg: 'rgba(0,0,0,0.2)',
    inputBorder: '#48484A',
  }), []);

  const dynamicStyles = `
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse-glow { 0% { box-shadow: 0 0 25px ${colors.primary}44; } 50% { box-shadow: 0 0 45px ${colors.primary}99; } 100% { box-shadow: 0 0 25px ${colors.primary}44; } }
    @keyframes background-pan {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    .staggered-fade-in-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    .button-shine::before {
      content: ''; position: absolute; top: 0; left: -150%; width: 100%; height: 100%;
      background: linear-gradient(110deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0) 60%);
      transform: skewX(-25deg); transition: left 1s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .button-shine:hover::before { left: 150%; }
  `;
  
  const pageStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
    fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative', padding: '20px',
    backgroundColor: colors.darkBg,
    // Se restaura la imagen de fondo original
    backgroundImage: 'url(/background-home.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    animation: 'background-pan 40s linear infinite alternate',
  };

  const cardStyle = {
    position: 'relative', zIndex: 2, width: '100%', maxWidth: '450px',
    padding: '45px 40px', background: `radial-gradient(circle at 50% 0%, rgba(142, 45, 226, 0.15), transparent 70%), ${colors.cardBg}e6`,
    backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    borderRadius: '32px', border: `1px solid ${colors.inputBorder}`, textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    transform: isMounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
    opacity: isMounted ? 1 : 0,
    transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
  };
  
  const getButtonStyle = () => {
    let style = {
      width: '100%', padding: '20px', marginTop: '20px', background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
      border: 'none', borderRadius: '16px', color: colors.textPrimary, fontSize: '20px', fontWeight: '700', letterSpacing: '0.5px',
      cursor: loading ? 'wait' : 'pointer', outline: 'none', transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: `0 10px 30px ${colors.secondary}77`,
      position: 'relative', overflow: 'hidden'
    };
    if (!isMounted) {
      style.opacity = 0;
    }
    let animationValue = isMounted ? 'fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards 0.9s' : 'none';
    if (!loading && isMounted) {
      animationValue += ', pulse-glow 4s infinite';
    }
    style.animation = animationValue;
    return style;
  };
  
  return (
    <>
      <style>{dynamicStyles}</style>
      <div style={pageStyle}>
        <main style={cardStyle}>
            <h1 style={{...{ color: colors.textPrimary, fontSize: '44px', fontWeight: '800', letterSpacing: '-2.5px', background: `linear-gradient(90deg, ${colors.primary}, #c9a4ff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 15px' }, ...(isMounted ? {animation: 'fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards', animationDelay: '0.3s'} : {opacity: 0})}}>
              Inicia la Conversación.
            </h1>
            <p style={{...{ color: colors.textSecondary, fontSize: '18px', margin: '0 auto 40px', lineHeight: '1.7', maxWidth: '350px' }, ...(isMounted ? {animation: 'fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards', animationDelay: '0.5s'} : {opacity: 0})}}>
              Crea tu espacio anónimo, compártelo y descubre lo que otros realmente piensan.
            </p>
            
            <form onSubmit={handleCreateAndRedirect}>
              <div style={isMounted ? {animationName: 'fadeInUp', animationDelay: '0.7s', opacity: 0} : {opacity:0}} className="staggered-fade-in-up">
                <input type="text" placeholder="Escribe tu nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                  style={{
                    width: '100%', padding: '20px', background: colors.inputBg,
                    border: `2px solid ${isFocused ? colors.primary : 'transparent'}`,
                    borderRadius: '16px', color: colors.textPrimary, fontSize: '18px',
                    textAlign: 'center', outline: 'none', boxSizing: 'border-box',
                    transition: 'all 0.3s ease', boxShadow: isFocused ? `0 0 30px ${colors.primary}66` : '0 4px 15px rgba(0,0,0,0.4)',
                  }}
                />
              </div>
              <button type="submit" disabled={loading}
                style={getButtonStyle()}
                className="button-shine"
                onMouseOver={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {loading ? <LoadingSpinner /> : "✨ Crear mi Espacio Secreto"}
              </button>
            </form>

            {error && <p style={{ color: colors.primary, marginTop: '20px' }}>{error}</p>}

            <footer style={{...{ marginTop: '40px', color: colors.textSecondary, fontSize: '14px'}, ...(isMounted ? {animation: 'fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards', animationDelay: '1.1s'} : {opacity: 0})}} className="staggered-fade-in-up">
              <span>¿Ya tienes una cuenta?</span>
              <a onClick={() => router.push('/login')} style={{ color: '#fff', textDecoration: 'none', fontWeight: '600', cursor: 'pointer', margin: '0 8px', position: 'relative', padding: '5px' }}>Inicia sesión</a>
            </footer>
        </main>
      </div>
    </>
  );
}