import { FriendList } from '../components/FriendList';

export async function FriendsPage(userId: string): Promise<string> {
  return await FriendList(userId);
}
