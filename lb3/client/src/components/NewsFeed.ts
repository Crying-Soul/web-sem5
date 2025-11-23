import { getMessages } from '../api/messages';
import { getFriends } from '../api/friends';
import type { Message, Friend } from './types.js';

export async function NewsFeed(userId: string): Promise<string> {
  const friends: Friend[] = (await getFriends()).filter((f: Friend) => f.userId === userId);
  const friendIds = friends.map((f: Friend) => f.friendId);
  const messages: Message[] = await getMessages();
  const feed = messages.filter((m: Message) => friendIds.includes(m.from));
  return `
    <div class="container mt-4">
      <h2>Новости друзей</h2>
      <ul class="list-group">
        ${feed.map((m: Message) => `<li class="list-group-item">${m.text} <span class="text-muted">(${m.date})</span></li>`).join('')}
      </ul>
    </div>
  `;
}
