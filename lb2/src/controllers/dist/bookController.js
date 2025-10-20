"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.BookController = exports.initializeLibrary = void 0;
var Library_js_1 = require("../models/Library.js");
var utils_js_1 = require("../utils/utils.js");
var library = new Library_js_1.Library();
function initializeLibrary() {
    return __awaiter(this, void 0, Promise, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, library.init()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.initializeLibrary = initializeLibrary;
var BookController = /** @class */ (function () {
    function BookController() {
    }
    // Форма создания книги
    BookController.createBookForm = function (req, res) {
        res.render('books/create', {
            title: 'Добавить книгу',
            currentPath: req.path,
            formData: null,
            errors: null
        });
    };
    // Форма редактирования книги
    BookController.updateBookForm = function (req, res, next) {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var book;
            return __generator(this, function (_b) {
                try {
                    book = library.getBookById((_a = req.params.id) !== null && _a !== void 0 ? _a : '');
                    if (!book) {
                        if (utils_js_1.isAjaxRequest(req)) {
                            res.status(404).json(utils_js_1.createErrorResponse('Книга не найдена'));
                            return [2 /*return*/];
                        }
                        res.status(404).render('error', {
                            title: 'Книга не найдена',
                            message: 'Книга не найдена',
                            error: "\u041A\u043D\u0438\u0433\u0430 \u0441 ID " + req.params.id + " \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430."
                        });
                        return [2 /*return*/];
                    }
                    res.render('books/edit', {
                        title: 'Редактировать книгу',
                        book: book.toJSON(),
                        currentPath: req.path,
                        errors: null
                    });
                }
                catch (err) {
                    next(err);
                }
                return [2 /*return*/];
            });
        });
    };
    BookController.getAllBooks = function (req, res, next) {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var status, showOverdue, searchQuery, books, booksJSON;
            return __generator(this, function (_b) {
                try {
                    status = req.query.status;
                    showOverdue = String(req.query.showOverdue) === 'true';
                    searchQuery = req.query.q;
                    books = void 0;
                    if (searchQuery) {
                        books = library.searchBooks(searchQuery);
                    }
                    else {
                        books = library.filterBooks({ status: status, showOverdue: showOverdue });
                    }
                    booksJSON = books.map(function (book) { return book.toJSON(); });
                    // Всегда возвращаем JSON для API запросов
                    if (utils_js_1.isAjaxRequest(req) || ((_a = req.headers.accept) === null || _a === void 0 ? void 0 : _a.includes('application/json'))) {
                        res.status(200).json(utils_js_1.createSuccessResponse(booksJSON));
                        return [2 /*return*/];
                    }
                    // Рендерим HTML только для прямых запросов браузера
                    res.render('books/index', {
                        title: 'Коллекция книг',
                        books: booksJSON,
                        filters: { status: status, showOverdue: showOverdue },
                        searchQuery: searchQuery,
                        currentPath: req.path
                    });
                }
                catch (err) {
                    next(err);
                }
                return [2 /*return*/];
            });
        });
    };
    BookController.getBookById = function (req, res, next) {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var book;
            return __generator(this, function (_b) {
                try {
                    book = library.getBookById((_a = req.params.id) !== null && _a !== void 0 ? _a : '');
                    if (!book) {
                        if (utils_js_1.isAjaxRequest(req)) {
                            res.status(404).json(utils_js_1.createErrorResponse('Книга не найдена'));
                            return [2 /*return*/];
                        }
                        res.status(404).render('error', {
                            title: 'Книга не найдена',
                            message: 'Книга не найдена',
                            error: "\u041A\u043D\u0438\u0433\u0430 \u0441 ID " + req.params.id + " \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430."
                        });
                        return [2 /*return*/];
                    }
                    if (utils_js_1.isAjaxRequest(req)) {
                        res.status(200).json(utils_js_1.createSuccessResponse(book.toJSON()));
                        return [2 /*return*/];
                    }
                    res.render('books/detail', {
                        title: book.title,
                        book: book.toJSON(),
                        currentPath: req.path
                    });
                }
                catch (err) {
                    next(err);
                }
                return [2 /*return*/];
            });
        });
    };
    BookController.createBook = function (req, res, next) {
        return __awaiter(this, void 0, Promise, function () {
            var body, _a, errors, bookData, book, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        body = req.body;
                        _a = utils_js_1.validateCreateBookPayload(body), errors = _a.errors, bookData = _a.value;
                        if (errors.length > 0) {
                            if (utils_js_1.isAjaxRequest(req)) {
                                res.status(400).json(utils_js_1.createErrorResponse(errors.join(', ')));
                                return [2 /*return*/];
                            }
                            res.status(400).render('books/create', {
                                title: 'Добавить книгу',
                                errors: errors,
                                formData: body,
                                currentPath: req.path
                            });
                            return [2 /*return*/];
                        }
                        // Обработка загрузки файла (только для form-data)
                        if (req.file && 'filename' in req.file) {
                            bookData.coverImage = "/uploads/covers/" + req.file.filename;
                        }
                        else if (body.coverImage && typeof body.coverImage === 'string') {
                            bookData.coverImage = body.coverImage;
                        }
                        return [4 /*yield*/, library.addBook(bookData)];
                    case 1:
                        book = _b.sent();
                        if (utils_js_1.isAjaxRequest(req)) {
                            res.status(201).json(utils_js_1.createSuccessResponse(book.toJSON(), 'Книга успешно добавлена'));
                            return [2 /*return*/];
                        }
                        req.flash('success', 'Книга успешно добавлена');
                        res.redirect('/books');
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _b.sent();
                        next(err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BookController.updateBook = function (req, res, next) {
        var _a, _b;
        return __awaiter(this, void 0, Promise, function () {
            var _c, errors, bookData, book_1, book, err_2;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        _c = utils_js_1.validateUpdateBookPayload(req.body), errors = _c.errors, bookData = _c.value;
                        if (errors.length > 0) {
                            if (utils_js_1.isAjaxRequest(req)) {
                                res.status(400).json(utils_js_1.createErrorResponse(errors.join(', ')));
                                return [2 /*return*/];
                            }
                            book_1 = library.getBookById((_a = req.params.id) !== null && _a !== void 0 ? _a : '');
                            res.status(400).render('books/edit', {
                                title: 'Редактировать книгу',
                                book: book_1 ? book_1.toJSON() : null,
                                currentPath: req.path,
                                errors: errors
                            });
                            return [2 /*return*/];
                        }
                        // Обработка загрузки файла
                        if (req.file && 'filename' in req.file) {
                            bookData.coverImage = "/uploads/covers/" + req.file.filename;
                        }
                        return [4 /*yield*/, library.updateBook((_b = req.params.id) !== null && _b !== void 0 ? _b : '', bookData)];
                    case 1:
                        book = _d.sent();
                        if (utils_js_1.isAjaxRequest(req)) {
                            res.status(200).json(utils_js_1.createSuccessResponse(book.toJSON(), 'Книга успешно обновлена'));
                            return [2 /*return*/];
                        }
                        req.flash('success', 'Книга успешно обновлена');
                        res.redirect("/books/" + req.params.id);
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _d.sent();
                        next(err_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BookController.deleteBook = function (req, res, next) {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var deleted, err_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, library.deleteBook((_a = req.params.id) !== null && _a !== void 0 ? _a : '')];
                    case 1:
                        deleted = _b.sent();
                        if (!deleted) {
                            if (utils_js_1.isAjaxRequest(req)) {
                                res.status(404).json(utils_js_1.createErrorResponse('Книга не найдена'));
                                return [2 /*return*/];
                            }
                            res.status(404).render('error', {
                                title: 'Книга не найдена',
                                message: 'Книга не найдена',
                                error: "\u041A\u043D\u0438\u0433\u0430 \u0441 ID " + req.params.id + " \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430."
                            });
                            return [2 /*return*/];
                        }
                        if (utils_js_1.isAjaxRequest(req)) {
                            res.status(200).json(utils_js_1.createSuccessResponse(undefined, 'Книга успешно удалена'));
                            return [2 /*return*/];
                        }
                        req.flash('success', 'Книга успешно удалена');
                        res.redirect('/books');
                        return [3 /*break*/, 3];
                    case 2:
                        err_3 = _b.sent();
                        next(err_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BookController.borrowBook = function (req, res, next) {
        var _a, _b, _c;
        return __awaiter(this, void 0, Promise, function () {
            var _d, errors, borrowData, book, err_4;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        _d = utils_js_1.validateBorrowPayload(req.body), errors = _d.errors, borrowData = _d.value;
                        if (errors.length > 0) {
                            if (utils_js_1.isAjaxRequest(req)) {
                                res.status(400).json(utils_js_1.createErrorResponse(errors.join(', ')));
                                return [2 /*return*/];
                            }
                            req.flash('error', errors.join(', '));
                            res.redirect("/books/" + req.params.id);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, library.borrowBook((_a = req.params.id) !== null && _a !== void 0 ? _a : '', borrowData.borrowerName, borrowData.days)];
                    case 1:
                        book = _e.sent();
                        if (utils_js_1.isAjaxRequest(req)) {
                            res.status(200).json(utils_js_1.createSuccessResponse(book.toJSON(), 'Книга успешно взята в аренду'));
                            return [2 /*return*/];
                        }
                        req.flash('success', 'Книга успешно взята в аренду');
                        res.redirect("/books/" + req.params.id);
                        return [3 /*break*/, 3];
                    case 2:
                        err_4 = _e.sent();
                        if (utils_js_1.isAjaxRequest(req)) {
                            res.status(400).json(utils_js_1.createErrorResponse((_b = err_4.message) !== null && _b !== void 0 ? _b : 'Ошибка при взятии книги'));
                            return [2 /*return*/];
                        }
                        req.flash('error', (_c = err_4.message) !== null && _c !== void 0 ? _c : 'Ошибка при взятии книги');
                        res.redirect("/books/" + req.params.id);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BookController.returnBook = function (req, res, next) {
        var _a, _b, _c;
        return __awaiter(this, void 0, Promise, function () {
            var book, err_5;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, library.returnBook((_a = req.params.id) !== null && _a !== void 0 ? _a : '')];
                    case 1:
                        book = _d.sent();
                        if (utils_js_1.isAjaxRequest(req)) {
                            res.status(200).json(utils_js_1.createSuccessResponse(book.toJSON(), 'Книга успешно возвращена'));
                            return [2 /*return*/];
                        }
                        req.flash('success', 'Книга успешно возвращена');
                        res.redirect("/books/" + req.params.id);
                        return [3 /*break*/, 3];
                    case 2:
                        err_5 = _d.sent();
                        if (utils_js_1.isAjaxRequest(req)) {
                            res.status(400).json(utils_js_1.createErrorResponse((_b = err_5.message) !== null && _b !== void 0 ? _b : 'Ошибка при возврате книги'));
                            return [2 /*return*/];
                        }
                        req.flash('error', (_c = err_5.message) !== null && _c !== void 0 ? _c : 'Ошибка при возврате книги');
                        res.redirect("/books/" + req.params.id);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BookController.searchBooks = function (req, res, next) {
        return __awaiter(this, void 0, Promise, function () {
            var query, books;
            return __generator(this, function (_a) {
                try {
                    query = String(req.query.q || '');
                    books = library.searchBooks(query).map(function (b) { return b.toJSON(); });
                    // Всегда JSON для поиска
                    res.status(200).json(utils_js_1.createSuccessResponse(books));
                }
                catch (err) {
                    next(err);
                }
                return [2 /*return*/];
            });
        });
    };
    return BookController;
}());
exports.BookController = BookController;
