export interface User {
  id: string;
  fullName: string;
  birthDate: string;
  email: string;
  photo: string;
  role: 'admin' | 'user' | 'администратор' | 'пользователь';
  status: 'pending' | 'active' | 'blocked' | 'не подтверждённый' | 'активный' | 'заблокированный';
  password: string;
}
