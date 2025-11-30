// news.js - исправленная версия для JWT
import express from 'express';
import { authenticateToken } from '../routes/auth.route.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const newsFilePath = path.join(__dirname, '../../../lb3/src/server/data/news.json');
const usersFilePath = path.join(__dirname, '../../../lb3/src/server/data/users.json');

export const router = express.Router();

// Get news feed
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const [newsData, usersData] = await Promise.all([
            fs.readFile(newsFilePath, 'utf8'),
            fs.readFile(usersFilePath, 'utf8')
        ]);

        let news = JSON.parse(newsData);
        const users = JSON.parse(usersData);

        const currentUser = users.find(user => user.id === userId);
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Filter news by friends
        if (currentUser.friends && currentUser.friends.length > 0) {
            news = news.filter(post => currentUser.friends.includes(post.authorId));
        } else {
            news = [];
        }

        // Add author info
        const postsWithAuthors = news.map(post => {
            const author = users.find(user => user.id === post.authorId);
            return {
                ...post,
                authorName: author ? `${author.firstName} ${author.lastName}` : 'Unknown User',
                authorAvatar: author?.photos?.[0] || null
            };
        });

        // Sort by date (newest first)
        postsWithAuthors.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ posts: postsWithAuthors });
    } catch (error) {
        console.error('Error loading news:', error);
        res.status(500).json({ error: 'Error loading news feed' });
    }
});

// Add new post
router.post('/:userId', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const userId = parseInt(req.params.userId);

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Content is required' });
        }

        const [newsData, usersData] = await Promise.all([
            fs.readFile(newsFilePath, 'utf8'),
            fs.readFile(usersFilePath, 'utf8')
        ]);

        const news = JSON.parse(newsData);
        const users = JSON.parse(usersData);

        // Create new post
        const newPost = {
            id: Math.max(0, ...news.map(n => n.id)) + 1,
            authorId: userId,
            content: content.trim(),
            date: new Date().toISOString(),
            likes: 0,
            comments: []
        };

        news.push(newPost);

        // Update user's news
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            if (!users[userIndex].news) {
                users[userIndex].news = [];
            }
            users[userIndex].news.push(newPost.id);
        }

        await Promise.all([
            fs.writeFile(newsFilePath, JSON.stringify(news, null, 2)),
            fs.writeFile(usersFilePath, JSON.stringify(users, null, 2))
        ]);

        // Add author info for response
        const author = users.find(user => user.id === userId);
        const postWithAuthor = {
            ...newPost,
            authorName: author ? `${author.firstName} ${author.lastName}` : 'You',
            authorAvatar: author?.photos?.[0] || null
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