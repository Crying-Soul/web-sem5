// users.js - исправленная версия для JWT
import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../routes/auth.route.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersFilePath = path.join(__dirname, '../../../lb3/src/server/data/users.json');
const assetsDir= path.join(__dirname, '../assets')

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, assetsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'photo-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

export const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);
        const user = users.find(u => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Error loading profile' });
    }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, birthDate, email } = req.body;
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);

        const userIndex = users.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        users[userIndex] = {
            ...users[userIndex],
            firstName: firstName || users[userIndex].firstName,
            lastName: lastName || users[userIndex].lastName,
            birthDate: birthDate || users[userIndex].birthDate,
            email: email || users[userIndex].email
        };

        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));

        const { password, ...userWithoutPassword } = users[userIndex];
        res.json({
            message: 'Profile updated successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({ error: 'Error updating profile' });
    }
});

// Upload photo
router.post('/profile/photo', authenticateToken, upload.single('photo'), async (req, res) => {
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

        const photoPath = `/assets/${req.file.filename}`;
        users[userIndex].photos = [photoPath];

        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));

        const { password, ...userWithoutPassword } = users[userIndex];
        res.json({
            message: 'Photo uploaded successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({ error: 'Error uploading photo' });
    }
});

// Remove photo
router.delete('/profile/photo', authenticateToken, async (req, res) => {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);

        const userIndex = users.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (users[userIndex].photos && users[userIndex].photos.length > 0) {
            const photoPath = users[userIndex].photos[0];
            const fullPath = path.join(__dirname, '..', photoPath);

            try {
                await fs.unlink(fullPath);
            } catch (error) {
                console.warn('Could not delete photo file:', error);
            }

            users[userIndex].photos = [];
        }

        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));

        const { password, ...userWithoutPassword } = users[userIndex];
        res.json({
            message: 'Photo removed successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({ error: 'Error removing photo' });
    }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);
        const user = users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Error loading user' });
    }
});

// Get all users
router.get('/', authenticateToken, async (req, res) => {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        res.json({ users: usersWithoutPasswords });
    } catch (error) {
        res.status(500).json({ error: 'Error loading users' });
    }
});