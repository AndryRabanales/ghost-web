"use client";
import React from "react";
import { useParams } from "next/navigation";
import MessageForm from "@/components/MessageForm";

export default function PublicPage() {
  const params = useParams();
  const creatorId = params.creatorId; // por si luego quieres usarlo

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Envía tu mensaje</h1>
      <MessageForm />
    </div>
  );
}
