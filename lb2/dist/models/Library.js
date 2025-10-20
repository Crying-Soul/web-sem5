import { Book } from './Book.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile, mkdir, access } from 'fs/promises';
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const DATA_FILE = join(DATA_DIR, 'books.json');
export class Library {
    books = new Map();
    constructor() { }
    async init() {
        await this.ensureDataDir();
        await this.loadBooks();
    }
    async ensureDataDir() {
        try {
            await mkdir(DATA_DIR, { recursive: true });
        }
        catch (err) {
            // ignore
        }
    }
    async loadBooks() {
        try {
            await access(DATA_FILE);
            const data = await readFile(DATA_FILE, 'utf8');
            const parsed = JSON.parse(data || '[]');
            parsed.forEach(b => {
                const book = new Book(b.id, {
                    title: b.title,
                    author: b.author,
                    publicationDate: b.publicationDate,
                    isbn: b.isbn,
                    coverImage: b.coverImage || null
                });
                if (b.status === 'borrowed') {
                    book.status = 'borrowed';
                    book.borrower = b.borrower;
                    book.borrowDate = b.borrowDate;
                    book.dueDate = b.dueDate;
                }
                this.books.set(b.id, book);
            });
        }
        catch (err) {
            // no data file yet - start empty and create file
            await this.saveBooks();
        }
    }
    async saveBooks() {
        const arr = Array.from(this.books.values()).map(b => b.toJSON());
        await writeFile(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
    }
    getAllBooks() {
        return Array.from(this.books.values());
    }
    getBookById(id) {
        return this.books.get(id);
    }
    async addBook(bookData) {
        const book = new Book(undefined, bookData);
        this.books.set(book.id, book);
        await this.saveBooks();
        return book;
    }
    async updateBook(id, bookData) {
        const book = this.books.get(id);
        if (!book)
            throw new Error('Book not found');
        Object.assign(book, bookData);
        await this.saveBooks();
        return book;
    }
    async deleteBook(id) {
        const deleted = this.books.delete(id);
        if (deleted) {
            await this.saveBooks();
        }
        return deleted;
    }
    async borrowBook(id, borrowerName, days = 14) {
        const book = this.books.get(id);
        if (!book)
            throw new Error('Book not found');
        book.borrow(borrowerName, days);
        await this.saveBooks();
        return book;
    }
    async returnBook(id) {
        const book = this.books.get(id);
        if (!book)
            throw new Error('Book not found');
        book.return();
        await this.saveBooks();
        return book;
    }
    filterBooks(options) {
        let books = this.getAllBooks();
        if (options.status && options.status !== 'all') {
            books = books.filter(book => book.status === options.status);
        }
        if (options.showOverdue) {
            books = books.filter(book => book.isOverdue);
        }
        return books;
    }
    searchBooks(query) {
        if (!query.trim())
            return this.getAllBooks();
        const searchTerm = query.toLowerCase();
        return this.getAllBooks().filter(book => book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.isbn.toLowerCase().includes(searchTerm));
    }
}
//# sourceMappingURL=Library.js.map