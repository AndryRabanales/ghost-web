// src/components/FirstMessageGuideModal.jsx
"use client";
// --- MODIFICADO: Importar useState ---
import React, { useEffect, useState } from 'react';

// --- ESTILOS ---
// (Estilos del modal sin cambios)
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(13, 12, 34, 0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  opacity: 0,
  animation: 'fadeInOverlay 0.5s forwards',
  backdropFilter: 'blur(5px)',
  WebkitBackdropFilter: 'blur(5px)',
};

const modalContentStyle = {
  background: 'linear-gradient(145deg, #1a1a2e, #2c1a5c)',
  padding: '30px 35px',
  borderRadius: '24px',
  border: '1px solid rgba(142, 45, 226, 0.3)',
  maxWidth: '420px',
  width: '97%',
  textAlign: 'center',
  color: 'var(--text-primary, #f5f5f5)',
  boxShadow: '0 15px 50px rgba(0, 0, 0, 0.6)',
  transform: 'translateY(20px) scale(0.95)',
  opacity: 0,
  animation: 'popUpModal 0.6s 0.1s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

const titleStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '15px',
};

const textStyle = {
    color: 'rgba(235, 235, 245, 0.7)',
    lineHeight: 1.7,
    fontSize: '15px',
    marginBottom: '20px',
    textAlign: 'left',
};

const highlightTextStyle = {
    fontWeight: '600',
    color: '#fff',
    marginTop: '20px',
    marginBottom: '15px',
    fontSize: '16px',
};

// --- MODIFICADO: Estilo base del botón ---
const baseButtonStyle = {
  marginTop: '25px',
  padding: '14px 30px',
  background: 'linear-gradient(90deg, #8e2de2, #4a00e0)',
  border: 'none',
  borderRadius: '12px',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '16px',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.3s ease, background 0.3s ease, opacity 0.3s ease',
  boxShadow: '0 5px 15px rgba(74, 0, 224, 0.3)',
};

// --- NUEVO: Estilo para el botón deshabilitado ---
const disabledButtonStyle = {
    background: '#3a3a4a',
    cursor: 'not-allowed',
    boxShadow: 'none',
    opacity: 0.7,
};

// --- NUEVO: Estilos para el Checkbox ---
const checkboxContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '25px',
  gap: '10px',
  cursor: 'pointer', // Para que todo el contenedor sea clickeable
};

const checkboxInputStyle = {
  cursor: 'pointer',
  width: '16px',
  height: '16px',
  accentColor: '#8e2de2', // Color del check
};

const checkboxLabelStyle = {
  color: 'var(--text-secondary)',
  fontSize: '14px',
  cursor: 'pointer',
  userSelect: 'none', // Evita que el texto se seleccione
};

// --- COMPONENTE MODIFICADO ---
export default function FirstMessageGuideModal({ onClose }) {
  
  // --- NUEVO: Estado para el checkbox ---
  const [isChecked, setIsChecked] = useState(false);

  // ... (hooks de Escape y temporizador sin cambios) ...
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(onClose, 20000); // Cierra automáticamente (puedes ajustar o quitar esto)
    return () => clearTimeout(timer);
  }, [onClose]);
  
  // --- NUEVO: Combinar estilos del botón ---
  const finalButtonStyle = {
      ...baseButtonStyle,
      ...(!isChecked ? disabledButtonStyle : {})
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        
        {/* --- Contenido del modal (sin cambios) --- */}
        <h2 style={titleStyle}>¡Bienvenido a este Espacio!</h2>
        <p style={textStyle}>
          Esta es un área diseñada para la comunicación abierta y honesta.
        </p>
        <p style={highlightTextStyle}>
          Normas de la Comunidad:
        </p>
        <p style={textStyle}>
          🔹 **Sé Respetuoso:** No se tolera el ciberbullying, el acoso, ni ningún tipo de discurso de odio.
          <br />
          🔹 **Sé Constructivo:** Usa este espacio para compartir ideas, no para atacar.
        </p>
        <p style={textStyle}>
          Al continuar, aceptas mantener una conversación respetuosa.
        </p>
        <p style={{...textStyle, fontSize: '12px', opacity: 0.6, marginBottom: '0'}}>
          (Próximamente se publicarán los Términos y Condiciones oficiales).
        </p>
        
        {/* --- 👇 NUEVO: Checkbox de Aceptación 👇 --- */}
        <div 
          style={checkboxContainerStyle} 
          onClick={() => setIsChecked(!isChecked)} // Permite clickear en todo el div
        >
          <input
            type="checkbox"
            id="terms-checkbox"
            checked={isChecked}
            onChange={() => setIsChecked(!isChecked)} // El onChange sigue aquí por accesibilidad
            style={checkboxInputStyle}
          />
          <label htmlFor="terms-checkbox" style={checkboxLabelStyle}>
            Acepto términos y condiciones
          </label>
        </div>
        {/* --- 👆 FIN DE Checkbox 👆 --- */}


        {/* --- 👇 MODIFICADO: Botón con estado disabled 👇 --- */}
        <button
          style={finalButtonStyle}
          onClick={onClose}
          disabled={!isChecked} // Deshabilitado si !isChecked
          onMouseOver={(e) => { if (isChecked) e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Entendido
        </button>
      </div>
      <style>{`
        @keyframes fadeInOverlay { to { opacity: 1; backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); } }
        @keyframes popUpModal { to { transform: translateY(0) scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}