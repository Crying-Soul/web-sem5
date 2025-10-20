import { Request, Response, NextFunction } from 'express';
import { Library } from '../models/Library.js';
import {
    validateCreateBookPayload,
    validateUpdateBookPayload,
    validateBorrowPayload,
    createSuccessResponse,
    createErrorResponse,
    isAjaxRequest
} from '../utils/utils.js';

const library = new Library();

export async function initializeLibrary(): Promise<void> {
    await library.init();
}

export class BookController {
    // Форма создания книги
    static createBookForm(req: Request, res: Response): void {
        res.render('books/create', {
            title: 'Добавить книгу',
            currentPath: req.path,
            formData: null,
            errors: null
        });
    }

    // Форма редактирования книги
    static async updateBookForm(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const book = library.getBookById(req.params.id ?? '');
            if (!book) {
                if (isAjaxRequest(req)) {
                    res.status(404).json(createErrorResponse('Книга не найдена'));
                    return;
                }
                res.status(404).render('error', {
                    title: 'Книга не найдена',
                    message: 'Книга не найдена',
                    error: `Книга с ID ${req.params.id} не найдена.`
                });
                return;
            }

            res.render('books/edit', {
                title: 'Редактировать книгу',
                book: book.toJSON(),
                currentPath: req.path,
                errors: null
            });
        } catch (err) {
            next(err);
        }
    }

    static async getAllBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = req.query.status as string | undefined;
            const showOverdue = String(req.query.showOverdue) === 'true';
            const searchQuery = req.query.q as string | undefined;

            let books;
            if (searchQuery) {
                books = library.searchBooks(searchQuery);
            } else {
                books = library.filterBooks({ status: status as any, showOverdue });
            }

            const booksJSON = books.map(book => book.toJSON());

            // Всегда возвращаем JSON для API запросов
            if (isAjaxRequest(req) || req.headers.accept?.includes('application/json')) {
                res.status(200).json(createSuccessResponse(booksJSON));
                return;
            }

            // Рендерим HTML только для прямых запросов браузера
            res.render('books/index', {
                title: 'Коллекция книг',
                books: booksJSON,
                filters: { status, showOverdue },
                searchQuery,
                currentPath: req.path
            });
        } catch (err) {
            next(err);
        }
    }

    static async getBookById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const book = library.getBookById(req.params.id ?? '');
            if (!book) {
                if (isAjaxRequest(req)) {
                    res.status(404).json(createErrorResponse('Книга не найдена'));
                    return;
                }
                res.status(404).render('error', {
                    title: 'Книга не найдена',
                    message: 'Книга не найдена',
                    error: `Книга с ID ${req.params.id} не найдена.`
                });
                return;
            }

            if (isAjaxRequest(req)) {
                res.status(200).json(createSuccessResponse(book.toJSON()));
                return;
            }

            res.render('books/detail', {
                title: book.title,
                book: book.toJSON(),
                currentPath: req.path
            });
        } catch (err) {
            next(err);
        }
    }

    static async createBook(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Для загрузки файлов используем multipart/form-data, для JSON - application/json
            let body = req.body;



            const { errors, value: bookData } = validateCreateBookPayload(body);

            if (errors.length > 0) {
                if (isAjaxRequest(req)) {
                    res.status(400).json(createErrorResponse(errors.join(', ')));
                    return;
                }
                res.status(400).render('books/create', {
                    title: 'Добавить книгу',
                    errors,
                    formData: body,
                    currentPath: req.path
                });
                return;
            }

            // Обработка загрузки файла (только для form-data)
            if (req.file && 'filename' in req.file) {
                bookData!.coverImage = `/uploads/covers/${req.file.filename}`;
            } else if (body.coverImage && typeof body.coverImage === 'string') {
                bookData!.coverImage = body.coverImage;
            }

            const book = await library.addBook(bookData!);

            if (isAjaxRequest(req)) {
                res.status(201).json(
                    createSuccessResponse(book.toJSON(), 'Книга успешно добавлена')
                );
                return;
            }

            req.flash('success', 'Книга успешно добавлена');
            res.redirect('/books');
        } catch (err) {
            next(err);
        }
    }

    static async updateBook(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { errors, value: bookData } = validateUpdateBookPayload(req.body);

            if (errors.length > 0) {
                if (isAjaxRequest(req)) {
                    res.status(400).json(createErrorResponse(errors.join(', ')));
                    return;
                }
                const book = library.getBookById(req.params.id ?? '');
                res.status(400).render('books/edit', {
                    title: 'Редактировать книгу',
                    book: book ? book.toJSON() : null,
                    currentPath: req.path,
                    errors
                });
                return;
            }

            // Обработка загрузки файла
            if (req.file && 'filename' in req.file) {
                bookData!.coverImage = `/uploads/covers/${req.file.filename}`;
            }

            const book = await library.updateBook(req.params.id ?? '', bookData!);

            if (isAjaxRequest(req)) {
                res.status(200).json(
                    createSuccessResponse(book.toJSON(), 'Книга успешно обновлена')
                );
                return;
            }

            req.flash('success', 'Книга успешно обновлена');
            res.redirect(`/books/${req.params.id}`);
        } catch (err) {
            next(err);
        }
    }

    static async deleteBook(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const deleted = await library.deleteBook(req.params.id ?? '');

            if (!deleted) {
                if (isAjaxRequest(req)) {
                    res.status(404).json(createErrorResponse('Книга не найдена'));
                    return;
                }
                res.status(404).render('error', {
                    title: 'Книга не найдена',
                    message: 'Книга не найдена',
                    error: `Книга с ID ${req.params.id} не найдена.`
                });
                return;
            }

            if (isAjaxRequest(req)) {
                res.status(200).json(createSuccessResponse(undefined, 'Книга успешно удалена'));
                return;
            }

            req.flash('success', 'Книга успешно удалена');
            res.redirect('/books');
        } catch (err) {
            next(err);
        }
    }

    static async borrowBook(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { errors, value: borrowData } = validateBorrowPayload(req.body);

            if (errors.length > 0) {
                if (isAjaxRequest(req)) {
                    res.status(400).json(createErrorResponse(errors.join(', ')));
                    return;
                }
                req.flash('error', errors.join(', '));
                res.redirect(`/books/${req.params.id}`);
                return;
            }

            const book = await library.borrowBook(
                req.params.id ?? '',
                borrowData!.borrowerName,
                borrowData!.days
            );

            if (isAjaxRequest(req)) {
                res.status(200).json(
                    createSuccessResponse(book.toJSON(), 'Книга успешно взята в аренду')
                );
                return;
            }

            req.flash('success', 'Книга успешно взята в аренду');
            res.redirect(`/books/${req.params.id}`);
        } catch (err: any) {
            if (isAjaxRequest(req)) {
                res.status(400).json(createErrorResponse(err.message ?? 'Ошибка при взятии книги'));
                return;
            }
            req.flash('error', err.message ?? 'Ошибка при взятии книги');
            res.redirect(`/books/${req.params.id}`);
        }
    }

    static async returnBook(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const book = await library.returnBook(req.params.id ?? '');

            if (isAjaxRequest(req)) {
                res.status(200).json(
                    createSuccessResponse(book.toJSON(), 'Книга успешно возвращена')
                );
                return;
            }

            req.flash('success', 'Книга успешно возвращена');
            res.redirect(`/books/${req.params.id}`);
        } catch (err: any) {
            if (isAjaxRequest(req)) {
                res.status(400).json(createErrorResponse(err.message ?? 'Ошибка при возврате книги'));
                return;
            }
            req.flash('error', err.message ?? 'Ошибка при возврате книги');
            res.redirect(`/books/${req.params.id}`);
        }
    }

    static async searchBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = String(req.query.q || '');
            const books = library.searchBooks(query).map(b => b.toJSON());

            // Всегда JSON для поиска
            res.status(200).json(createSuccessResponse(books));
        } catch (err) {
            next(err);
        }
    }
}