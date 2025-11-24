import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import newsRoutes from './routes/news.js';
import messagesRoutes from './routes/messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const PATH = '../../dist-gulp';

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, PATH, 'html'));

app.use(express.json());

// Статические файлы из dist-gulp
app.use(express.static(path.join(__dirname, PATH)));
app.use('/images', express.static(path.join(__dirname, PATH, 'images')));
app.use('/css', express.static(path.join(__dirname, PATH, 'css')));
app.use('/js', express.static(path.join(__dirname, PATH, 'js')));
app.use('/html', express.static(path.join(__dirname, PATH, 'html')));

app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/messages', messagesRoutes);

// Маршруты для HTML страниц
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, PATH, 'html/users.html'));
});

app.get('/users.html', (req, res) => {
    res.sendFile(path.join(__dirname, PATH, 'html/users.html'));
});

app.get('/friends.html', (req, res) => {
    res.sendFile(path.join(__dirname, PATH, 'html/friends.html'));
});

app.get('/news.html', (req, res) => {
    res.sendFile(path.join(__dirname, PATH, 'html/news.html'));
});

app.get('/messages.html', (req, res) => {
    res.sendFile(path.join(__dirname, PATH, 'html/messages.html'));
});

// Обработка 404
app.get('*', (req, res) => {
    res.status(404).send('Page not found');
});

const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.pem'))
};

https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`HTTPS Server running on https://localhost:${PORT}`);
});