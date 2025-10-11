// src/components/LivesStatus.jsx
"use client";
import React from "react";

export default function LivesStatus({ creator }) {
  if (!creator) return null;

  // Ya no necesitamos el bloque <style> aquí, lo moveremos a globals.css

  return (
    // Aplicamos clases CSS para un control total desde el archivo global
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
          <div className="hearts-container">
            {Array.from({ length: creator.maxLives }).map((_, i) => (
              <span 
                key={i} 
                className={i < creator.lives ? 'heart-icon full' : 'heart-icon empty'}
              >
                ❤️
              </span>
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