// src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';
import flash from 'connect-flash';
import dotenv from 'dotenv';

import indexRouter from './routes/index.js';
import booksRouter from './routes/books.js';
import authRouter from './routes/auth.js';
import { initPassport } from './middleware/auth.js';
import { initializeLibrary } from './controllers/bookController.js';

// Load env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isDev = process.env.NODE_ENV !== 'production';

// Paths - исправляем пути для production и development
const rootPath = path.resolve(__dirname);
const viewsPath = path.join(rootPath, 'views');
const publicPath = path.join(rootPath, 'public');

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
app.use(express.static(publicPath));
app.use('/uploads', express.static(path.join(publicPath, 'uploads')));

// Если в development, обслуживаем исходные SCSS/TS файлы
if (isDev) {
  app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
  app.use('/scss', express.static(path.join(__dirname, 'public', 'scss')));
}

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// app.use((req: Request, res: Response, next: NextFunction) => {
//     // Убедитесь что Content-Type правильно обрабатывается
//     if (req.headers['content-type']?.includes('application/json')) {
//         express.json()(req, res, next);
//     } else {
//         next();
//     }
// });

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true
    },
  })
);

// Flash
app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());
initPassport(passport);

// Locals for templates
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.currentPath = req.path;
  res.locals.currentUser = (req as any).user || null;
  res.locals.messages = req.flash();
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.isDev = isDev;
  
  // Добавляем путь к статическим файлам
  res.locals.staticPath = isDev ? '' : '/public';
  next();
});

// Routes
app.use('/', indexRouter);
app.use('/books', booksRouter);
app.use('/auth', authRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).render('error', {
    title: 'Страница не найдена',
    message: 'Страница не найдена',
    error: `Путь ${req.path} не существует`,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Ошибка:', err && err.stack ? err.stack : err);
  res.status(500).render('error', {
    title: 'Внутренняя ошибка сервера',
    message: 'Внутренняя ошибка сервера',
    error: isDev ? (err && err.message ? err.message : String(err)) : undefined,
  });
});

// Start
async function startServer() {
  try {
    await initializeLibrary();
    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
      console.log(`Окружение: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Путь к шаблонам: ${viewsPath}`);
      console.log(`Путь к статике: ${publicPath}`);
    });
  } catch (error) {
    console.error('Ошибка инициализации библиотеки:', error);
    process.exit(1);
  }
}

startServer();