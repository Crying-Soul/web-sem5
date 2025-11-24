import express from 'express';
import multer from 'multer';
import { ensureAuthenticated } from '../middleware/auth.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersFilePath = path.join(__dirname, '../../../lab3/src/server/data/users.json');
const assetsDir= path.join(__dirname, '../assets')

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, assetsDir);
    },
    filename: (req, file, cb) => {
        // Генерируем уникальное имя файла: timestamp + оригинальное имя
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'photo-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});


async function removePhotoFile(photoPath) {
    if (photoPath && photoPath.startsWith('/assets/')) {
        try {
            const photoFullPath = path.join(__dirname, '../', photoPath);
            await fs.unlink(photoFullPath);
        } catch (error) {
            console.warn('Could not delete photo file:', error);
        }
    }
}

export const router = express.Router();

router.post('/profile/photo', ensureAuthenticated, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);

        const userIndex = users.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (users[userIndex].photos && users[userIndex].photos.length > 0) {
            const oldPhotoPath = users[userIndex].photos[0];
            await removePhotoFile(oldPhotoPath);
            users[userIndex].photos = [];
        }

        // Создаем относительный путь для хранения в JSON
        const photoPath = `/assets/${req.file.filename}`;

        // Инициализируем массив photos если его нет
        if (!users[userIndex].photos) {
            users[userIndex].photos = [];
        }

        // Добавляем новое фото
        users[userIndex].photos.unshift(photoPath);

        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));

        const { password, ...userWithoutPassword } = users[userIndex];
        res.json({
            message: 'Photo uploaded successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Error uploading photo' });
    }
});

// Удаление фото профиля
router.delete('/profile/photo', ensureAuthenticated, async (req, res) => {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);

        const userIndex = users.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!users[userIndex].photos || users[userIndex].photos.length === 0) {
            return res.status(400).json({ error: 'No photos to remove' });
        }

        // Получаем путь к файлу для удаления
        const photoToRemove = users[userIndex].photos[0];

        // Удаляем файл из файловой системы
        if (photoToRemove.startsWith('/assets/')) {
            const photoFullPath = path.join(__dirname, '../../../lab4/src/server', photoToRemove);
            try {
                await fs.unlink(photoFullPath);
            } catch (error) {
                console.warn('Could not delete photo file:', error);
                // Продолжаем выполнение даже если файл не найден
            }
        }

        // Удаляем фото из массива пользователя
        users[userIndex].photos.shift(); // Удаляем первое фото

        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));

        const { password, ...userWithoutPassword } = users[userIndex];
        res.json({
            message: 'Photo removed successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error removing photo:', error);
        res.status(500).json({ error: 'Error removing photo' });
    }
});

// Получить профиль текущего пользователя
router.get('/profile', ensureAuthenticated, async (req, res) => {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);
        const user = users.find(u => u.id === req.user.id);
        if (user) {
            // Не возвращаем пароль
            const { password, ...userWithoutPassword } = user;
            res.json({ user: userWithoutPassword });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error loading profile' });
    }
});

// Получить пользователя по ID
router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);
        const user = users.find(u => u.id === userId);

        if (user) {
            // Не возвращаем пароль
            const { password, ...userWithoutPassword } = user;
            res.json({ user: userWithoutPassword });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error loading user' });
    }
});

// Получить всех пользователей
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);

        // Убираем пароли
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);

        res.json({ users: usersWithoutPasswords });
    } catch (error) {
        res.status(500).json({ error: 'Error loading users' });
    }
});

// Обновить профиль текущего пользователя
router.put('/profile', ensureAuthenticated, async (req, res) => {
    try {
        const { firstName, lastName, birthDate, email } = req.body;
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);

        const userIndex = users.findIndex(u => u.id === req.user.id);
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                firstName,
                lastName,
                birthDate,
                email
            };

            await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));

            const { password, ...userWithoutPassword } = users[userIndex];
            res.json({
                message: 'Profile updated successfully',
                user: userWithoutPassword
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error updating profile' });
    }
});

// Обновить пользователя по ID
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { firstName, lastName, birthDate, email } = req.body;
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);

        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                firstName,
                lastName,
                birthDate,
                email
            };

            await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));

            const { password, ...userWithoutPassword } = users[userIndex];
            res.json({
                message: 'User updated successfully',
                user: userWithoutPassword
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error updating user' });

    }
});