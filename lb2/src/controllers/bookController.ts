// server/controllers/BookController.ts
import { Request, Response } from 'express';
import { Library } from '../models/library.js';
import type { BookFilters } from '../types.js';

const library = new Library();
await library.init();

export class BookController {
  // Pages
  static async listPage(req: Request, res: Response) {
    try {
      // в listPage
      const q = req.query as Record<string, string | undefined>;
      const filters: BookFilters = {};

      // text query
      if (q.q) filters.q = q.q;

      // isAvailable
      if (q.isAvailable === 'true') filters.isAvailable = true;
      else if (q.isAvailable === 'false') filters.isAvailable = false;

      // isOverdue normalization
      const isOverdueParam = q.isOverdue === 'true' || q.isOverdue === 'on' || q.isOverdue === '1';
      if (isOverdueParam) filters.isOverdue = true;

      const books = library.getAll(filters);
      res.render('books/list', {
        books,
        filters: {
          isAvailable: q.isAvailable || '',
          isOverdue: isOverdueParam ? 'true' : '',
          q: q.q || ''
        },
        title: 'Библиотека — Список книг'
      });

    } catch (error) {
      console.error('List page error:', error);
      res.status(500).render('error', {
        message: 'Ошибка при загрузке списка книг',
        title: 'Ошибка'
      });
    }
  }

  static async getPage(req: Request, res: Response) {
    try {
      const book = library.getById(req.params.id);
      if (!book) {
        return res.status(404).render('error', {
          message: 'Книга не найдена',
          title: '404 — Книга не найдена'
        });
      }
      res.render('books/detail', { book, title: `Книга — ${book.title}` });
    } catch (error) {
      console.error('Detail page error:', error);
      res.status(500).render('error', { message: 'Ошибка при загрузке книги', title: 'Ошибка' });
    }
  }

  static createForm(_req: Request, res: Response) {
    res.render('books/create', { title: 'Добавить книгу' });
  }

  static editForm(req: Request, res: Response) {
    try {
      const book = library.getById(req.params.id);
      if (!book) {
        return res.status(404).render('error', { message: 'Книга не найдена', title: '404 — Книга не найдена' });
      }
      res.render('books/edit', { book, title: `Редактировать — ${book.title}` });
    } catch (error) {
      console.error('Edit form error:', error);
      res.status(500).render('error', { message: 'Ошибка при загрузке формы редактирования', title: 'Ошибка' });
    }
  }

  // API
  static async apiList(req: Request, res: Response) {
    try {
      const q = req.query as Record<string, string | undefined>;
      const filters: BookFilters = {};
      if (q.q) filters.q = q.q;
      if (q.isAvailable === 'true') filters.isAvailable = true;
      else if (q.isAvailable === 'false') filters.isAvailable = false;
      if (q.isOverdue === 'true' || q.isOverdue === 'on' || q.isOverdue === '1') filters.isOverdue = true;

      const raw = library.getAll(filters);
      return res.json(raw);
    } catch (error) {
      console.error('API list error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async apiGet(req: Request, res: Response) {
    try {
      const book = library.getById(req.params.id);
      if (!book) return res.status(404).json({ error: 'Book not found' });
      return res.json(book);
    } catch (error) {
      console.error('API get error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async apiCreate(req: Request, res: Response) {
    try {
      const { title, author, publicationDate } = req.body;
      if (!title?.trim()) return res.status(400).json({ error: 'Название книги обязательно' });
      if (!author?.trim()) return res.status(400).json({ error: 'Автор книги обязателен' });
      if (!publicationDate) return res.status(400).json({ error: 'Дата публикации обязательна' });

      const publicationDateObj = new Date(publicationDate);
      if (Number.isNaN(publicationDateObj.getTime())) return res.status(400).json({ error: 'Неверный формат даты публикации' });

      const coverImage = (req as any).file?.filename;
      const newBook = await library.add({
        title: title.trim(),
        author: author.trim(),
        publicationDate: publicationDateObj.toISOString(),
        coverImage
      });
      return res.status(201).json(newBook);
    } catch (error) {
      console.error('API create error:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  static async apiUpdate(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const { title, author, publicationDate } = req.body;
      const payload: any = {};
      if (title !== undefined) payload.title = title.trim();
      if (author !== undefined) payload.author = author.trim();
      if (publicationDate) {
        const d = new Date(publicationDate);
        if (Number.isNaN(d.getTime())) return res.status(400).json({ error: 'Неверный формат даты публикации' });
        payload.publicationDate = d.toISOString();
      }
      if ((req as any).file) payload.coverImage = (req as any).file.filename;
      const updated = await library.update(id, payload);
      if (!updated) return res.status(404).json({ error: 'Книга не найдена' });
      return res.json(updated);
    } catch (error) {
      console.error('API update error:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  static async apiDelete(req: Request, res: Response) {
    try {
      const ok = await library.remove(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Книга не найдена' });
      return res.json({ message: 'Книга удалена' });
    } catch (error) {
      console.error('API delete error:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  static async apiBorrow(req: Request, res: Response) {
    try {
      const { borrowerName, dueDate } = req.body;
      if (!borrowerName?.trim()) return res.status(400).json({ error: 'Имя читателя обязательно' });
      if (!dueDate) return res.status(400).json({ error: 'Дата возврата обязательна' });

      const dueDateObj = new Date(dueDate);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (Number.isNaN(dueDateObj.getTime()) || dueDateObj.getTime() < today.getTime()) {
        return res.status(400).json({ error: 'Неверная дата возврата' });
      }

      const result = await library.borrow(req.params.id, borrowerName.trim(), dueDateObj.toISOString());
      if (result === undefined) return res.status(404).json({ error: 'Книга не найдена или недоступна' });
      if (result === null) return res.status(400).json({ error: 'Неверная дата возврата' });
      return res.json(result);
    } catch (error) {
      console.error('API borrow error:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  static async apiReturn(req: Request, res: Response) {
    try {
      const result = await library.restore(req.params.id);
      if (!result) return res.status(404).json({ error: 'Книга не найдена или уже возвращена' });
      return res.json(result);
    } catch (error) {
      console.error('API return error:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
}
