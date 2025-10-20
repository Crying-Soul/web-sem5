export interface Book {
    id: string;
    title: string;
    author: string;
    publicationDate: string;
    isbn: string;
    coverImage: string | null;
    status: 'available' | 'borrowed';
    borrower: string | null;
    borrowDate: string | null;
    dueDate: string | null;
    isOverdue: boolean;
}

export interface BookCreateData {
    title: string;
    author: string;
    publicationDate: string;
    isbn: string;
    coverImage?: string | null;
}

export interface BookUpdateData {
    title?: string;
    author?: string;
    publicationDate?: string;
    isbn?: string;
    coverImage?: string | null;
}

export interface BorrowData {
    borrowerName: string;
    days: number;
}

export type CreateBookPayload = {
    title?: unknown;
    author?: unknown;
    publicationDate?: unknown;
    isbn?: unknown;
    coverImage?: unknown | null;
};

export type UpdateBookPayload = Partial<CreateBookPayload>;

export type BorrowPayload = {
    borrowerName?: unknown;
    days?: unknown;
};

export type FilterOptions = {
    status?: 'all' | 'available' | 'borrowed';
    showOverdue?: boolean;
};

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export type CreateBookDTO = BookCreateData;
export type UpdateBookDTO = BookUpdateData;
export type BorrowDTO = BorrowData;