import { Book, BookFilters } from '../types.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'library.json');
const COVERS_DIR = join(process.cwd(), 'public', 'images', 'covers');

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(COVERS_DIR, { recursive: true });
}

export class Library {
  private books: Book[] = [];

  constructor() {
    // initialize sync
  }

  async init() {
    await ensureDirs();
    await this.load();
  }

  private async load() {
    try {
      if (!existsSync(DATA_FILE)) {
        this.books = [];
        await this.save();
        return;
      }
      const raw = await fs.readFile(DATA_FILE, 'utf-8');
      this.books = JSON.parse(raw) as Book[];
    } catch (err) {
      console.warn('Library.load -> starting empty library', err);
      this.books = [];
      await this.save();
    }
  }

  private async save() {
    try {
      const tmp = `${DATA_FILE}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(this.books, null, 2), 'utf-8');
      await fs.rename(tmp, DATA_FILE);
    } catch (error) {
      console.error('Library save error:', error);
      throw new Error('Failed to save library data');
    }
  }

  private now() {
    return new Date().toISOString();
  }

  getAll(filters?: BookFilters): Book[] {
    const today = new Date();
    let res = [...this.books];
    
    if (filters?.isAvailable !== undefined) {
      res = res.filter((b) => b.isAvailable === filters.isAvailable);
    }
    
    if (filters?.isOverdue) {
      res = res.filter((b) => {
        if (b.isAvailable || !b.dueDate) return false;
        return new Date(b.dueDate).getTime() < today.getTime();
      });
    }
    
    res.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    return res;
  }

  getById(id: string): Book | undefined {
    return this.books.find((b) => b.id === id);
  }

  async add(data: { 
    title: string; 
    author: string; 
    publicationDate: string; 
    coverImage?: string 
  }): Promise<Book> {
    const newBook: Book = {
      id: uuidv4(),
      title: data.title.trim(),
      author: data.author.trim(),
      publicationDate: new Date(data.publicationDate).toISOString(),
      coverImage: data.coverImage,
      isAvailable: true,
      createdAt: this.now(),
    };
    
    this.books.push(newBook);
    await this.save();
    return newBook;
  }

  async update(id: string, patch: Partial<Book>): Promise<Book | undefined> {
    const i = this.books.findIndex((b) => b.id === id);
    if (i === -1) return undefined;
    
    const old = this.books[i];
    
    // Remove old cover image if replaced
    if (patch.coverImage && old.coverImage && patch.coverImage !== old.coverImage) {
      try {
        await fs.unlink(join(COVERS_DIR, old.coverImage));
      } catch (error) {
        console.warn('Failed to remove old cover image:', error);
      }
    }
    
    const updated = { 
      ...old, 
      ...patch, 
      updatedAt: this.now() 
    };
    
    this.books[i] = updated;
    await this.save();
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const i = this.books.findIndex((b) => b.id === id);
    if (i === -1) return false;
    
    const book = this.books[i];
    
    // Remove cover image
    if (book.coverImage) {
      try {
        await fs.unlink(join(COVERS_DIR, book.coverImage));
      } catch (error) {
        console.warn('Failed to remove cover image:', error);
      }
    }
    
    this.books.splice(i, 1);
    await this.save();
    return true;
  }

  async borrow(id: string, borrowerName: string, dueDateIso: string): Promise<Book | undefined | null> {
    const book = this.getById(id);
    if (!book || !book.isAvailable) return undefined;
    
    const due = new Date(dueDateIso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(due.getTime()) || due.getTime() < today.getTime()) {
      return null;
    }
    
    return this.update(id, {
      isAvailable: false,
      borrower: borrowerName.trim(),
      dueDate: due.toISOString(),
    });
  }

  async restore(id: string): Promise<Book | undefined> {
    const book = this.getById(id);
    if (!book || book.isAvailable) return undefined;
    
    return this.update(id, { 
      isAvailable: true, 
      borrower: undefined, 
      dueDate: undefined 
    });
  }
}