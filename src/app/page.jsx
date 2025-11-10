// src/app/page.jsx (Versión "Portal")
"use client";
// --- MODIFICADO: Eliminados 'useState' y 'useMemo' que ya no se usan ---
import { useEffect, useState, useMemo } from "react"; 
import { useRouter } from "next/navigation";

// --- ELIMINADO: API ya no se usa en esta página ---
// const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- ELIMINADO: LoadingSpinner ya no se usa ---

// --- Componente Principal de la Página de Inicio ---
export default function Home() {
  const router = useRouter();

  // --- ELIMINADO: Estados del formulario ---
  // const [name, setName] = useState("");
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);
  // const [isFocused, setIsFocused] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // --- ELIMINADO: Función handleCreateAndRedirect ---

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
    
    /* --- NUEVO: Estilo para el botón secundario (Iniciar Sesión) --- */
    .secondary-button {
      width: 100%; padding: 20px; margin-top: 15px; 
      background: ${colors.inputBg}; /* Fondo oscuro sutil */
      border: 2px solid ${colors.inputBorder}; /* Borde gris */
      border-radius: 16px; color: ${colors.textSecondary}; 
      font-size: 18px; font-weight: 600;
      cursor: pointer; outline: 'none';
      transition: all 0.3s ease;
      display: 'flex'; alignItems: 'center'; justify-content: 'center'; gap: '12px';
      position: 'relative'; overflow: 'hidden';
    }
    .secondary-button:hover {
      border-color: ${colors.primary};
      color: ${colors.textPrimary};
      box-shadow: 0 0 20px ${colors.primary}44;
    }
  `;

  // Estilos en línea (sin cambios)
  const pageStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
    fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative', padding: '20px',
    backgroundColor: colors.darkBg,
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

  // Estilo para el botón principal (Registrarse)
  const getButtonStyle = () => {
    let style = {
      width: '100%', padding: '20px', marginTop: '20px', background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
      border: 'none', borderRadius: '16px', color: colors.textPrimary, fontSize: '20px', fontWeight: '700', letterSpacing: '0.5px',
      cursor: 'pointer', outline: 'none', transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: `0 10px 30px ${colors.secondary}77`,
      position: 'relative', overflow: 'hidden'
    };
    if (!isMounted) style.opacity = 0;
    let animationValue = isMounted ? 'fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards 0.7s' : 'none';
    if (isMounted) animationValue += ', pulse-glow 4s infinite';
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

            {/* --- INICIO DE LA MODIFICACIÓN --- */}

            {/* 1. Botón de Registrarse */}
            <button
              style={getButtonStyle()}
              className="button-shine"
              onClick={() => router.push('/register')}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              ✨ Crear mi Espacio Secreto
            </button>

            {/* 2. Botón de Iniciar Sesión */}
            <button
              className="secondary-button staggered-fade-in-up"
              style={{animationDelay: '0.9s', opacity: isMounted ? 0 : 0}}
              onClick={() => router.push('/login')}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              ¿Ya tienes una cuenta? Inicia sesión
            </button>

            {/* --- ELIMINADO: El <form> y el <footer> --- */}

            {/* --- FIN DE LA MODIFICACIÓN --- */}
        </main>
      </div>
    </>
  );
}