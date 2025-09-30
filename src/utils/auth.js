// utils/auth.js

/**
 * Refresca el token del usuario usando su publicId
 */
export async function refreshToken(publicId) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API}/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error renovando token");
  
      // Guardar nuevo token en localStorage
      localStorage.setItem("token", data.token);
  
      return data.token;
    } catch (err) {
      console.error("❌ Error en refreshToken:", err);
      return null;
    }
  }
  
  /**
   * Devuelve headers con el token actual desde localStorage
   */
  export function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  