import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const newsPath = path.join(__dirname, '../data/news.json');
const usersPath = path.join(__dirname, '../data/users.json');

router.get('/:userId', async (req, res) => {
    try {

        const userId = parseInt(req.params.userId);
        const news = await fs.readJson(newsPath);
        const users = await fs.readJson(usersPath);

        // Находим пользователя и его друзей
        const user = users.find(u => u.id === userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const friendIds = user.friends || [];

        // Фильтруем новости только друзей
        const friendsNews = news.filter(item =>
            friendIds.includes(item.authorId)
        );

        // Добавляем имена авторов
        const newsWithAuthors = friendsNews.map(item => {
            const author = users.find(u => u.id === item.authorId);
            return {
                ...item,
                authorName: author ? `${author.firstName} ${author.lastName}` : 'Неизвестный'
            };
        });

        res.json(newsWithAuthors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load news' });
    }
});

export default router;