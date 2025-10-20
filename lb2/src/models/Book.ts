import { Book as BookInterface, BookCreateData } from '../types/api.type.js';
import { v4 as uuidv4 } from 'uuid';


export class Book implements BookInterface {
    id: string;
    title: string;
    author: string;
    publicationDate: string;
    isbn: string;
    coverImage: string | null;
    status: 'available' | 'borrowed' = 'available';
    borrower: string | null = null;
    borrowDate: string | null = null;
    dueDate: string | null = null;


    constructor(idOrUndefined: string | undefined, data: BookCreateData) {
        this.id = idOrUndefined || uuidv4();
        this.title = data.title;
        this.author = data.author;
        this.publicationDate = data.publicationDate;
        this.isbn = data.isbn || '';
        this.coverImage = data.coverImage || null;
    }


    get isOverdue(): boolean {
        if (this.status !== 'borrowed' || !this.dueDate) return false;
        return new Date() > new Date(this.dueDate);
    }


    borrow(borrowerName: string, days = 14) {
        if (this.status !== 'available') throw new Error('Book is not available');
        this.status = 'borrowed';
        this.borrower = borrowerName;
        this.borrowDate = new Date().toISOString();
        this.dueDate = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
    }


    return() {
        if (this.status !== 'borrowed') throw new Error('Book is not borrowed');
        this.status = 'available';
        this.borrower = null;
        this.borrowDate = null;
        this.dueDate = null;
    }


    toJSON(): BookInterface {
        return {
            id: this.id,
            title: this.title,
            author: this.author,
            publicationDate: this.publicationDate,
            isbn: this.isbn,
            coverImage: this.coverImage,
            status: this.status,
            borrower: this.borrower,
            borrowDate: this.borrowDate,
            dueDate: this.dueDate,
            isOverdue: this.isOverdue
        };
    }
}