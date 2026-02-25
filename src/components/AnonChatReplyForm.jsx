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
        <div className="premium-reply-form">
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    className="premium-input"
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="premium-send-btn"
                    disabled={isDisabled}
                >
                    {loading ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    ) : (
                        <>
                            <span>Enviar</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                        </>
                    )}
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
        </div>
    );
}
