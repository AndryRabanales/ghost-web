"use client";
import React from "react";

export default function MessageList({ messages, onStatusChange }) {
  if (!messages || messages.length === 0) {
    return <p style={{ padding: 20 }}>No hay predicciones aún.</p>;
  }

  return (
    <div style={{ marginTop: 20 }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
          }}
        >
          <strong>{new Date(msg.createdAt).toLocaleString()}: </strong>
          {msg.isLocked ? (
            <span style={{ color: "gray" }}>
              🔒 Mensaje secreto (se desbloquea en 24h)
            </span>
          ) : (
            <span>{msg.content}</span>
          )}
          <div>Estado: {msg.status}</div>
          {!msg.isLocked && (
            <>
              <button
                onClick={() => onStatusChange(msg.id, "FULFILLED")}
                style={{ background: "green", color: "white", marginRight: 5 }}
              >
                ✔ Cumplida
              </button>
              <button
                onClick={() => onStatusChange(msg.id, "NOT_FULFILLED")}
                style={{ background: "red", color: "white" }}
              >
                ✖ No cumplida
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
