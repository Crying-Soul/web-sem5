import { getFriends } from '../api/friends';
import type { Friend } from './types.js';

export async function FriendList(userId: string): Promise<string> {
  const friends: Friend[] = (await getFriends()).filter((f: Friend) => f.userId === userId);
  return `
    <div class="container mt-4">
      <h2>Друзья пользователя</h2>
      <ul class="list-group">
        ${friends.map((f: Friend) => `<li class="list-group-item">${f.friendId}</li>`).join('')}
      </ul>
    </div>
  `;
}
