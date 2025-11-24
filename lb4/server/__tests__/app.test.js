import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';

// Импортируем роуты
import { router as authRouter } from '../routes/auth.route.js';
import { router as usersRouter } from '../routes/users.js';
import { router as friendsRouter } from '../routes/friends.js';
import { router as newsRouter } from '../routes/news.js';
import { jest, describe, beforeAll, beforeEach, test, expect } from "@jest/globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock данные
const mockUsers = [
    {
        id: 1,
        username: 'testuser',
        password: '$2a$10$TESTHASH', // bcrypt hash for 'password123'
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'user',
        status: 'unconfirmed',
        friends: [],
        photos: [],
        news: []
    },
    {
        id: 2,
        username: 'frienduser',
        password: '$2a$10$TESTHASH2',
        firstName: 'Friend',
        lastName: 'User',
        email: 'friend@example.com',
        role: 'user',
        status: 'unconfirmed',
        friends: [],
        photos: [],
        news: []
    }
];

const mockFriends = [];
const mockNews = [];

// Правильный способ мока fs/promises
const fs = {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn()
};

// Mock multer
jest.mock('multer', () => {
    const multer = () => ({
        single: () => (req, res, next) => {
            req.file = {
                filename: 'test-photo.jpg',
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
                size: 1024
            };
            next();
        },
        diskStorage: () => ({})
    });
    multer.diskStorage = jest.fn();
    return multer;
});

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn().mockImplementation((password, hash) => {
        // Простое сравнение для тестов
        return Promise.resolve(password === 'password123');
    })
}));

// Создаем тестовое приложение
function createTestApp() {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Mock аутентификация
    passport.use(new LocalStrategy(async (username, password, done) => {
        try {
            const user = mockUsers.find(u => u.username === username);
            if (!user) {
                return done(null, false, { message: 'Invalid credentials' });
            }

            // В тестах используем простое сравнение паролей
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return done(null, false, { message: 'Invalid credentials' });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = mockUsers.find(u => u.id === parseInt(id));
            done(null, user || false);
        } catch (error) {
            done(error);
        }
    });

    // Middleware для тестовой аутентификации
    const mockEnsureAuthenticated = (req, res, next) => {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            const token = req.headers.authorization.split(' ')[1];
            if (token === 'user1') {
                req.user = mockUsers[0];
                return next();
            } else if (token === 'user2') {
                req.user = mockUsers[1];
                return next();
            }
        }
        return res.status(401).json({ error: 'Unauthorized' });
    };

    // Подменяем ensureAuthenticated middleware в роутах
    const replaceAuthMiddleware = (router) => {
        router.stack = router.stack.map(layer => {
            if (layer.route) {
                layer.route.stack = layer.route.stack.map(handler => {
                    // Заменяем ensureAuthenticated middleware
                    if (handler.name === 'ensureAuthenticated' ||
                        (typeof handler.handle === 'function' && handler.handle.name === 'ensureAuthenticated')) {
                        handler.handle = mockEnsureAuthenticated;
                    }
                    return handler;
                });
            }
            return layer;
        });
    };

    // Заменяем middleware во всех роутах
    replaceAuthMiddleware(authRouter);
    replaceAuthMiddleware(usersRouter);
    replaceAuthMiddleware(friendsRouter);
    replaceAuthMiddleware(newsRouter);

    app.use('/auth', authRouter);
    app.use('/users', usersRouter);
    app.use('/friends', friendsRouter);
    app.use('/news', newsRouter);

    return app;
}

describe('Social Network API Tests', () => {
    let app;

    beforeAll(() => {
        app = createTestApp();
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Настраиваем моки для fs
        fs.readFile.mockImplementation((filePath) => {
            if (filePath && filePath.includes('users.json')) {
                return Promise.resolve(JSON.stringify(mockUsers));
            } else if (filePath && filePath.includes('friends.json')) {
                return Promise.resolve(JSON.stringify(mockFriends));
            } else if (filePath && filePath.includes('news.json')) {
                return Promise.resolve(JSON.stringify(mockNews));
            }
            return Promise.reject(new Error('File not found'));
        });

        fs.writeFile.mockResolvedValue();
        fs.unlink.mockResolvedValue();
    });

    describe('Authentication Routes', () => {

        test('POST /auth/login - should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('POST /auth/logout - should logout user', async () => {
            const response = await request(app)
                .post('/auth/logout')
                .set('Authorization', 'Bearer user1');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Logout successful');
        });
    });

    // ... остальные тесты остаются без изменений
    describe('Users Routes', () => {

        test('GET /users/:id - should get user by ID', async () => {
            const response = await request(app)
                .get('/users/1')
                .set('Authorization', 'Bearer user1');

            expect(response.status).toBe(200);
            expect(response.body.user).toHaveProperty('id', 1);
        });


        test('PUT /users/profile - should update user profile', async () => {
            const updatedData = {
                firstName: 'Updated',
                lastName: 'Name',
                birthDate: '1995-01-01',
                email: 'updated@example.com'
            };

            const response = await request(app)
                .put('/users/profile')
                .set('Authorization', 'Bearer user1')
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Profile updated successfully');
        });

        test('POST /users/profile/photo - should upload profile photo', async () => {
            const response = await request(app)
                .post('/users/profile/photo')
                .set('Authorization', 'Bearer user1')
                .attach('photo', Buffer.from('test'), 'test.jpg');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Photo uploaded successfully');
        });

        test('DELETE /users/profile/photo - should remove profile photo', async () => {
            // First, mock user with photo
            const userWithPhoto = {
                ...mockUsers[0],
                photos: ['/assets/test-photo.jpg']
            };

            fs.readFile.mockImplementationOnce(() =>
                Promise.resolve(JSON.stringify([userWithPhoto, mockUsers[1]]))
            );

            const response = await request(app)
                .delete('/users/profile/photo')
                .set('Authorization', 'Bearer user1');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Photo removed successfully');
        });
    });

    describe('Friends Routes', () => {
        test('GET /friends/users - should get users with friendship status', async () => {
            const response = await request(app)
                .get('/friends/users')
                .set('Authorization', 'Bearer user1');

            expect(response.status).toBe(200);
            expect(response.body.users).toBeInstanceOf(Array);
        });

        test('GET /friends/requests - should get incoming friend requests', async () => {
            const response = await request(app)
                .get('/friends/requests')
                .set('Authorization', 'Bearer user2');

            expect(response.status).toBe(200);
            expect(response.body.requests).toBeInstanceOf(Array);
        });

        test('GET /friends - should get current friends', async () => {
            const response = await request(app)
                .get('/friends')
                .set('Authorization', 'Bearer user1');

            expect(response.status).toBe(200);
            expect(response.body.friends).toBeInstanceOf(Array);
        });

    });

    describe('News Routes', () => {
        test('POST /news/:userId - should create new post', async () => {
            const newPost = {
                content: 'This is a test post'
            };

            const response = await request(app)
                .post('/news/1')
                .set('Authorization', 'Bearer user1')
                .send(newPost);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Post created successfully');
        });
    });

    describe('Error Handling', () => {
        test('Should return 401 for unauthorized access', async () => {
            const response = await request(app)
                .get('/users/profile');

            expect(response.status).toBe(401);
        });

        test('Should return 404 for non-existent user', async () => {
            const response = await request(app)
                .get('/users/999')
                .set('Authorization', 'Bearer user1');

            expect(response.status).toBe(404);
        });
    });
});