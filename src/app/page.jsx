import MessageForm from './components/MessageForm';
import MessageList from './components/MessageList';

export default function Page() {
  return (
    <main>
      <h1>NGL Clone</h1>
      <MessageForm />
      <MessageList />
    </main>
  );
}
