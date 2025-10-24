// src/components/LivesStatus.jsx
"use client";
import React from "react";

// --- SVG del Corazón ---
// Puedes personalizar el color ('currentColor' toma el color del texto CSS)
const HeartIcon = ({ filled }) => (
  <svg
    width="24" // Ajusta el tamaño base aquí si es necesario
    height="24" // Ajusta el tamaño base aquí si es necesario
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"} // Relleno si está 'filled', sin relleno si no
    stroke="currentColor" // Siempre tiene borde
    strokeWidth="1.5" // Grosor del borde
    xmlns="http://www.w3.org/2000/svg"
    className={`heart-svg ${filled ? 'filled' : 'empty'}`} // Clases para CSS
  >
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


export default function LivesStatus({ creator }) {
  if (!creator) return null;

  return (
    <div className="lives-status-container">
      <h4 className="lives-status-title">
        Tu Estado
      </h4>
      {creator.isPremium ? (
        <div className="premium-status-display">
          <div className="star-icon">⭐</div>
          <div className="premium-status-text">Cuenta Premium</div>
          <div className="premium-status-subtext">Vidas Ilimitadas</div>
        </div>
      ) : (
        <div className="non-premium-status">
          {/* Contenedor Flex para los SVGs */}
          <div className="hearts-container">
            {Array.from({ length: creator.maxLives }).map((_, i) => (
              <HeartIcon key={i} filled={i < creator.lives} />
            ))}
          </div>
          <div className="next-life-text">
            Próxima vida en:
            <strong>
              {creator.minutesToNextLife > 0 ? `${creator.minutesToNextLife} min` : '¡Ahora!'}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}