// app/u/[publicId]/page.jsx
import AnonMessageForm from "@/components/AnonMessageForm";

export default function PublicPage({ params }) {
  const { publicId } = params;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Envíame un mensaje anónimo</h1>
      <AnonMessageForm publicId={publicId} />
    </div>
  );
}
