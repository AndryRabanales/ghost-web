"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API;

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/creators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando dashboard");
      router.push(data.dashboardUrl);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Crear mi Dashboard</h1>
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Tu nombre (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
          }}
        >
          Generar Dashboard
        </button>
      </form>
    </div>
  );
}
