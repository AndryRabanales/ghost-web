import MessageForm from "@/app/components/MessageForm";

export default function PublicPage({ params }) {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Envíame un mensaje anónimo</h1>
      <MessageForm publicId={params.publicId} />
    </div>
  );
}
