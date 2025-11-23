export async function getMessages() {
  const res = await fetch('/api/messages');
  return await res.json();
}
