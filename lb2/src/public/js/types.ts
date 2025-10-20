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

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface LibraryAppInterface {
    returnBook(bookId: string): Promise<void>;
    openBorrowModal(bookId: string, bookTitle: string): void;
    closeModal(modalId: string): void;
}

declare global {
    interface Window {
        returnBook: (bookId: string) => void;
        openBorrowModal: (bookId: string, bookTitle: string) => void;
        closeModal: (modalId: string) => void;
        libraryApp?: LibraryAppInterface;
    }
}

export {};