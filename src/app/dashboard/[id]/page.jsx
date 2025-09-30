"use client";
import { useEffect } from "react";

export default function DashboardPage({ params, searchParams }) {
  useEffect(() => {
    // ✅ Guardar token si viene en la URL
    if (searchParams?.token) {
      localStorage.setItem("token", searchParams.token);
      console.log("Token guardado en localStorage ✅");
    }

    // ✅ Guardar dashboardId
    if (params?.id) {
      localStorage.setItem("dashboardId", params.id);
      console.log("DashboardId guardado en localStorage ✅");
    }
  }, [params, searchParams]);

  return (
    <div style={{ padding: 20 }}>
      <h1>📊 Dashboard {params.id}</h1>
      <p>Ya se guardaron el <b>token</b> y el <b>dashboardId</b> en localStorage.</p>
      <p>Ahora los componentes como <code>MessageList</code> pueden usarlos en los fetch.</p>
    </div>
  );
}
