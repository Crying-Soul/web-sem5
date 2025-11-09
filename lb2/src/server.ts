// src/server.ts
import express from 'express';
import path from 'path';
import apiRoutes from './routes/api.js';
import pageRoutes from './routes/pages.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Настройки
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');

// Middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);
app.use('/', pageRoutes);

// Error handling
app.use((req, res) => {
  res.status(404).render('error', { 
    message: 'Страница не найдена',
    title: '404 - Страница не найдена'
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).render('error', { 
    message: 'Внутренняя ошибка сервера',
    title: '500 - Ошибка сервера'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.info(`Сервер запущен на http://localhost:${PORT}`);
});