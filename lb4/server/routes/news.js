import express from 'express';
import { ensureAuthenticated } from '../middleware/auth.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const newsFilePath = path.join(__dirname, '../../../lb3/src/server/data/news.json');
const usersFilePath = path.join(__dirname, '../../../lb3/src/server/data/users.json');

export const router = express.Router();

// Получить ленту новостей
router.get('/:userId', ensureAuthenticated, async (req, res) => {
    try {
        const newsData = await fs.readFile(newsFilePath, 'utf8');
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        let news = JSON.parse(newsData);
        const users = JSON.parse(usersData);
        const userId=parseInt(req.params.userId);
        const currentUser = users.find(user => user.id === userId);

        news = currentUser?.friends
            ? news.filter((n) => currentUser.friends.includes(n.authorId))
            : [];
        // Добавляем информацию об авторах к новостям
        const postsWithAuthors = news.map(post => {
            const author = users.find(user => user.id === post.authorId);
            return {
                ...post,
                authorName: author ? `${author.firstName} ${author.lastName}` : 'Неизвестный пользователь'
            };
        });

        // Сортируем по дате (новые сначала)
        postsWithAuthors.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ posts: postsWithAuthors });
    } catch (error) {
        console.error('Error loading news:', error);
        res.status(500).json({ error: 'Error loading news feed' });
    }
});

// Добавить новую запись
router.post(`/:userId`, ensureAuthenticated, async (req, res) => {
    try {
        const { content } = req.body;
        const newsData = await fs.readFile(newsFilePath, 'utf8');
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const userId=parseInt(req.params.userId);
        const news = JSON.parse(newsData);
        const users = JSON.parse(usersData);
        // Создаем новую запись
        const newPost = {
            id: news.length > 0 ? Math.max(...news.map(n => n.id)) + 1 : 1,
            authorId: userId,
            content,
            date: new Date().toISOString().split('T')[0]
        };
        news.push(newPost);
        // Обновляем список новостей пользователя
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].news.push(newPost.id);
        }

        await fs.writeFile(newsFilePath, JSON.stringify(news, null, 2));
        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));

        // Добавляем информацию об авторе для ответа
        const author = users.find(user => user.id === req.userId);
        const postWithAuthor = {
            ...newPost,
            authorName: author ? `${author.firstName} ${author.lastName}` : 'Вы'
        };

        res.json({
            message: 'Post created successfully',
            post: postWithAuthor
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Error creating post' });
    }
});