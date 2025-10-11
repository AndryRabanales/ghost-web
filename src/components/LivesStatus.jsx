// src/components/LivesStatus.jsx
"use client";
import React from "react";

export default function LivesStatus({ creator }) {
  if (!creator) return null;

  const styles = `
    @keyframes heart-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    .heart-icon {
      animation: heart-pulse 2.5s ease-in-out infinite;
    }
    @keyframes star-glow {
      0% { text-shadow: 0 0 10px rgba(255,215,0,0.4); }
      50% { text-shadow: 0 0 25px rgba(255,215,0,0.8); }
      100% { text-shadow: 0 0 10px rgba(255,215,0,0.4); }
    }
    .star-icon {
      animation: star-glow 3s ease-in-out infinite;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div style={{ marginBottom: 25, textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 15px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>
          Tu Estado
        </h4>
        {creator.isPremium ? (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="star-icon" style={{ fontSize: '36px', marginBottom: '8px', color: 'gold' }}>⭐</div>
            <div style={{fontWeight: 'bold', fontSize: '18px'}}>Cuenta Premium</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,215,0,0.7)'}}>Vidas Ilimitadas</div>
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="hearts-container" style={{ fontSize: '28px', letterSpacing: '4px', marginBottom: '12px' }}>
              {Array.from({ length: creator.maxLives }).map((_, i) => (
                <span key={i} className={i < creator.lives ? 'heart-icon' : ''} style={{ 
                  display: 'inline-block',
                  animationDelay: `${i * 0.1}s`,
                  opacity: i < creator.lives ? 1 : 0.2,
                  transition: 'opacity 0.5s ease'
                }}>
                  ❤️
                </span>
              ))}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
              Próxima vida en: 
              <strong style={{ color: '#fff', letterSpacing: '0.5px', marginLeft: '5px', background: '#38383a', padding: '3px 8px', borderRadius: '6px' }}>
                {creator.minutesToNextLife > 0 ? `${creator.minutesToNextLife} min` : '¡Ahora!'}
              </strong>
            </div>
          </div>
        )}
      </div>
    </>
  );
}