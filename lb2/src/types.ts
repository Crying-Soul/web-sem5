// src/types.ts
export type Book = {
  id: string;
  title: string;
  author: string;
  publicationDate: string; // ISO date
  coverImage?: string;
  isAvailable: boolean;
  borrower?: string;
  dueDate?: string; // ISO date
  createdAt: string;
  updatedAt?: string;
};

export interface BookFilters {
  isAvailable?: boolean;
  isOverdue?: boolean;
}