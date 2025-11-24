import express from 'express';
import bcrypt from 'bcryptjs';
import { passport, ensureAuthenticated, ensureNotAuthenticated, createUser, findUser } from '../middleware/auth.js';

export const router = express.Router();

// Login
router.post('/login', ensureNotAuthenticated, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(400).json({ error: info.message });

        req.login(user, (err) => {
            if (err) return next(err);

            // Устанавливаем cookie с ID пользователя
            res.cookie('userId', user.id, {
                httpOnly: true,
                secure: false, // true в production с HTTPS
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 // 24 часа
            });

            return res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                }
            });
        });
    })(req, res, next);
});

// Register
router.post('/register', ensureNotAuthenticated, async (req, res) => {
    try {
        const { firstName, lastName, birthDate, email, username, password } = req.body;

        // Проверка обязательных полей
        if (!firstName || !lastName || !birthDate || !email || !username || !password) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }

        // Проверяем, существует ли пользователь
        const existingUser = await findUser(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await createUser({
            firstName,
            lastName,
            birthDate,
            email,
            username,
            password: hashedPassword,
            role: "user",
            status: "unconfirmed",
            friends: [],
            photos: [],
            news: [],
        });

        res.json({
            message: 'User created successfully',
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error creating user: ' + error.message });
    }
});

// Logout
router.post('/logout', ensureAuthenticated, (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Error logging out' });

        // Очищаем cookie
        res.clearCookie('userId');
        res.clearCookie('connect.sid'); // Очищаем сессионную cookie

        res.json({ message: 'Logout successful' });
    });
});

// Check auth status
router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                role: req.user.role,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Получить ID пользователя из cookie (для фронтенда)
router.get('/user-id', (req, res) => {
    const userId = req.cookies.userId;
    if (userId) {
        res.json({ userId: parseInt(userId) });
    } else {
        res.json({ userId: null });
    }
});