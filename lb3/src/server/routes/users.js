import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const usersPath = path.join(__dirname, '../data/users.json');

router.get('/', async (req, res) => {
    try {
        const users = await fs.readJson(usersPath);
        res.json(users);
    } catch (error) {
        console.error('Error reading users:', error);
        res.status(500).json({ error: 'Failed to read users' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const users = await fs.readJson(usersPath);
        const userId = parseInt(req.params.id);
        const userIndex = users.findIndex(user => user.id === userId);

        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...req.body };
            await fs.writeJson(usersPath, users, { spaces: 2 });
            res.json(users[userIndex]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

export default router;