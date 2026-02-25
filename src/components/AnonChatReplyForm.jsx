"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://api.ghostmsg.space";

export default function AnonChatReplyForm({ anonToken, chatId, onMessageSent }) {
    const [newMsg, setNewMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [sendSound, setSendSound] = useState(null);

    useState(() => {
        if (typeof Audio !== "undefined") {
            // You can change this to a different sound if you have one, or reuse chaching
            setSendSound(new Audio('/chaching.mp3')); // Or 'chaching.mp3' if pop doesn't exist
        }
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMsg.trim() || loading) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API}/${anonToken}/${chatId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMsg }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Error respondiendo al mensaje.");
            }

            const msgData = await res.json();

            if (sendSound) {
                sendSound.currentTime = 0;
                sendSound.play().catch(err => console.warn("Audio no se puro reproducir", err));
            }

            setNewMsg("");
            // if (onMessageSent) onMessageSent(msgData); // Eliminado para no duplicar con el WebSocket
        } catch (err) {
            console.error("Error en handleSend:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = loading || !newMsg.trim();

    return (
        <>
            <form onSubmit={handleSend} className="chat-reply-form">
                <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    className="form-input-field reply-input"
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="submit-button reply-button"
                    disabled={isDisabled}
                >
                    {loading ? "..." : "Enviar"}
                </button>
            </form>

            {error && (
                <div style={{
                    fontSize: '13px',
                    color: '#ff7b7b',
                    textAlign: 'center',
                    fontWeight: '600',
                    marginTop: '10px',
                    padding: '8px',
                    background: 'rgba(255, 123, 123, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid #ff7b7b'
                }}>
                    {error}
                </div>
            )}
        </>
    );
}
