export async function getFriends() {
  const res = await fetch('/api/friends');
  return await res.json();
}
