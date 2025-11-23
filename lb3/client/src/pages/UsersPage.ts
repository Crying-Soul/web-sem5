import { UserList } from '../components/UserList';

export async function UsersPage(): Promise<HTMLDivElement> {
  return await UserList();
}
