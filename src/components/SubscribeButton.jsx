"use client";
const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function SubscribeButton() {
  const handleSubscribe = async () => {
    try {
      const res = await fetch(`${API}/subscribe`, { method: "POST" });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point; // 🔗 redirige a Mercado Pago
      } else {
        alert("Error iniciando suscripción");
      }
    } catch (err) {
      console.error("❌ Error en la suscripción:", err);
      alert("Error en la suscripción");
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      style={{
        padding: "10px 20px",
        backgroundColor: "#0070f3",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      Hazte Premium 🚀
    </button>
  );
}
