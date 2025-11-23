import type { User } from '../components/types.js';

export async function getUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  return await res.json();
}

export async function updateUser(user: User): Promise<User> {
  const res = await fetch(`/api/users/${user.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(user)
  });
  return await res.json();
}
