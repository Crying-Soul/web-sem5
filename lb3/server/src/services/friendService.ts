import fs from 'node:fs/promises';
import path from 'node:path';
import { Friend } from '../models/friend.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const FRIENDS_PATH = path.join(__dirname, '../../data/friends.json');

export async function getFriends(): Promise<Friend[]> {
  try {
    const data = await fs.readFile(FRIENDS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function addFriend(friend: Friend): Promise<Friend> {
  const friends = await getFriends();
  friends.push(friend);
  await fs.writeFile(FRIENDS_PATH, JSON.stringify(friends, null, 2));
  return friend;
}
