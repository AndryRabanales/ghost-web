"use client";
import React from "react";
import MessageForm from "@/components/MessageForm";

export default function PublicPage({ params }) {
  const { publicId } = params;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Enviar un mensaje</h1>
      <MessageForm publicId={publicId} />
    </div>
  );
}
