import express from 'express';
import session from 'express-session';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { ensureAuthenticated, passport } from './middleware/auth.js';
import { router as authRoutes } from './routes/auth.route.js';
import { router as usersRoutes } from './routes/users.js';
import { router as newsRoutes } from './routes/news.js';
import { router as friendsRoutes } from './routes/friends.js';
import { router as messagesRoutes } from './routes/messages.js';
import { setupWebSocket } from './socket.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Настройка WebSocket
const io = setupWebSocket(server);

// Добавляем io в app для использования в роутах
app.set('io', io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));

app.use(cookieParser());

app.use(session({
    secret: 'social-network-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/messages', messagesRoutes);

// Статическая раздача папки assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Social Network API Server is running',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;