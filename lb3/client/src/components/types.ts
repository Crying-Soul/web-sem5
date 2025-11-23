export interface User {
  id: string;
  name: string;
  birthDate: string;
  email: string;
  photo: string;
  role: 'admin' | 'user';
  status: 'pending' | 'active' | 'blocked';
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friendName?: string;
  friendPhoto?: string;
}

export interface Message {
  id: string;
  from: string;
  fromName?: string;
  to: string;
  text: string;
  date: string;
  type?: 'text' | 'image' | 'video';
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}