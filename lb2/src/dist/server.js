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
// src/server.ts
var express_1 = require("express");
var path_1 = require("path");
var url_1 = require("url");
var express_session_1 = require("express-session");
var passport_1 = require("passport");
var connect_flash_1 = require("connect-flash");
var dotenv_1 = require("dotenv");
var index_js_1 = require("./routes/index.js");
var books_js_1 = require("./routes/books.js");
var auth_js_1 = require("./routes/auth.js");
var auth_js_2 = require("./middleware/auth.js");
var bookController_js_1 = require("./controllers/bookController.js");
// Load env
dotenv_1["default"].config();
var __filename = url_1.fileURLToPath(import.meta.url);
var __dirname = path_1["default"].dirname(__filename);
var app = express_1["default"]();
var PORT = Number(process.env.PORT || 3000);
var isDev = process.env.NODE_ENV !== 'production';
// Paths - исправляем пути для production и development
var rootPath = path_1["default"].resolve(__dirname);
var viewsPath = path_1["default"].join(rootPath, 'views');
var publicPath = path_1["default"].join(rootPath, 'public');
console.log('Root path:', rootPath);
console.log('Views path:', viewsPath);
console.log('Public path:', publicPath);
// Trust proxy in production if behind a proxy (for secure cookies)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}
// View engine
app.set('views', viewsPath);
app.set('view engine', 'pug');
// Static files - исправляем обслуживание статических файлов
app.use(express_1["default"].static(publicPath));
app.use('/uploads', express_1["default"].static(path_1["default"].join(publicPath, 'uploads')));
// Если в development, обслуживаем исходные SCSS/TS файлы
if (isDev) {
    app.use('/js', express_1["default"].static(path_1["default"].join(__dirname, 'public', 'js')));
    app.use('/scss', express_1["default"].static(path_1["default"].join(__dirname, 'public', 'scss')));
}
// Parsers
app.use(express_1["default"].json({ limit: '10mb' }));
app.use(express_1["default"].urlencoded({ extended: true, limit: '10mb' }));
// app.use((req: Request, res: Response, next: NextFunction) => {
//     // Убедитесь что Content-Type правильно обрабатывается
//     if (req.headers['content-type']?.includes('application/json')) {
//         express.json()(req, res, next);
//     } else {
//         next();
//     }
// });
// Sessions
app.use(express_session_1["default"]({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: true
    }
}));
// Flash
app.use(connect_flash_1["default"]());
// Passport
app.use(passport_1["default"].initialize());
app.use(passport_1["default"].session());
auth_js_2.initPassport(passport_1["default"]);
// Locals for templates
app.use(function (req, res, next) {
    res.locals.currentPath = req.path;
    res.locals.currentUser = req.user || null;
    res.locals.messages = req.flash();
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.isDev = isDev;
    // Добавляем путь к статическим файлам
    res.locals.staticPath = isDev ? '' : '/public';
    next();
});
// Routes
app.use('/', index_js_1["default"]);
app.use('/books', books_js_1["default"]);
app.use('/auth', auth_js_1["default"]);
// 404 handler
app.use(function (req, res) {
    res.status(404).render('error', {
        title: 'Страница не найдена',
        message: 'Страница не найдена',
        error: "\u041F\u0443\u0442\u044C " + req.path + " \u043D\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442"
    });
});
// Global error handler
app.use(function (err, req, res, next) {
    console.error('Ошибка:', err && err.stack ? err.stack : err);
    res.status(500).render('error', {
        title: 'Внутренняя ошибка сервера',
        message: 'Внутренняя ошибка сервера',
        error: isDev ? (err && err.message ? err.message : String(err)) : undefined
    });
});
// Start
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, bookController_js_1.initializeLibrary()];
                case 1:
                    _a.sent();
                    app.listen(PORT, function () {
                        console.log("\u0421\u0435\u0440\u0432\u0435\u0440 \u0437\u0430\u043F\u0443\u0449\u0435\u043D \u043D\u0430 http://localhost:" + PORT);
                        console.log("\u041E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u0435: " + (process.env.NODE_ENV || 'development'));
                        console.log("\u041F\u0443\u0442\u044C \u043A \u0448\u0430\u0431\u043B\u043E\u043D\u0430\u043C: " + viewsPath);
                        console.log("\u041F\u0443\u0442\u044C \u043A \u0441\u0442\u0430\u0442\u0438\u043A\u0435: " + publicPath);
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Ошибка инициализации библиотеки:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
startServer();
