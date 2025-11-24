import express from 'express';
import { ensureAuthenticated } from '../middleware/auth.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const messagesFilePath = path.join(__dirname, '../../../lab3/src/server/data/messages.json');
const usersFilePath = path.join(__dirname, '../../../lab3/src/server/data/users.json');

export const router = express.Router();

// Получить список диалогов (пользователей, с которыми есть переписка)
router.get('/conversations', ensureAuthenticated, async (req, res) => {
    try {
        const messagesData = await fs.readFile(messagesFilePath, 'utf8');
        const usersData = await fs.readFile(usersFilePath, 'utf8');

        const messages = JSON.parse(messagesData);
        const users = JSON.parse(usersData);

        const currentUserId = req.user.id;

        // Находим всех пользователей, с которыми есть переписка
        const conversationUserIds = new Set();
        messages.forEach(message => {
            if (message.senderId === currentUserId) {
                conversationUserIds.add(message.receiverId);
            } else if (message.receiverId === currentUserId) {
                conversationUserIds.add(message.senderId);
            }
        });

        // Добавляем друзей для возможности начать новый диалог
        const currentUser = users.find(u => u.id === currentUserId);
        if (currentUser && currentUser.friends) {
            currentUser.friends.forEach(friendId => {
                conversationUserIds.add(friendId);
            });
        }

        const conversations = Array.from(conversationUserIds).map(userId => {
            const user = users.find(u => u.id === userId);
            if (!user) return null;

            // Находим последнее сообщение в диалоге
            const lastMessage = messages
                .filter(m =>
                    (m.senderId === currentUserId && m.receiverId === userId) ||
                    (m.senderId === userId && m.receiverId === currentUserId)
                )
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

            // Считаем непрочитанные сообщения
            const unreadCount = messages.filter(m =>
                m.senderId === userId &&
                m.receiverId === currentUserId &&
                !m.read
            ).length;

            const { password, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    timestamp: lastMessage.timestamp,
                    isOwn: lastMessage.senderId === currentUserId
                } : null,
                unreadCount
            };
        }).filter(conv => conv !== null);

        // Сортируем по времени последнего сообщения (сверху самые новые)
        conversations.sort((a, b) => {
            if (!a.lastMessage && !b.lastMessage) return 0;
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
        });

        res.json({ conversations });
    } catch (error) {
        console.error('Error loading conversations:', error);
        res.status(500).json({ error: 'Error loading conversations' });
    }
});

// Получить историю сообщений с конкретным пользователем
router.get('/conversation/:userId', ensureAuthenticated, async (req, res) => {
    try {
        const otherUserId = parseInt(req.params.userId);
        const currentUserId = req.user.id;

        const messagesData = await fs.readFile(messagesFilePath, 'utf8');
        const usersData = await fs.readFile(usersFilePath, 'utf8');

        const messages = JSON.parse(messagesData);
        const users = JSON.parse(usersData);

        // Проверяем существование пользователя
        const otherUser = users.find(u => u.id === otherUserId);
        if (!otherUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Получаем сообщения между текущим пользователем и выбранным
        const conversationMessages = messages
            .filter(message =>
                (message.senderId === currentUserId && message.receiverId === otherUserId) ||
                (message.senderId === otherUserId && message.receiverId === currentUserId)
            )
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Помечаем сообщения как прочитанные
        const updatedMessages = [...messages];
        let hasUpdates = false;

        conversationMessages.forEach(msg => {
            if (msg.receiverId === currentUserId && !msg.read) {
                const msgIndex = updatedMessages.findIndex(m => m.id === msg.id);
                if (msgIndex !== -1) {
                    updatedMessages[msgIndex].read = true;
                    hasUpdates = true;
                }
            }
        });

        if (hasUpdates) {
            await fs.writeFile(messagesFilePath, JSON.stringify(updatedMessages, null, 2));
        }

        const { password, ...otherUserWithoutPassword } = otherUser;

        res.json({
            user: otherUserWithoutPassword,
            messages: conversationMessages
        });
    } catch (error) {
        console.error('Error loading conversation:', error);
        res.status(500).json({ error: 'Error loading conversation' });
    }
});

// Отправить сообщение
router.post('/send/:userId', ensureAuthenticated, async (req, res) => {
    try {
        const receiverId = parseInt(req.params.userId);
        const { content } = req.body;
        const currentUserId = req.user.id;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const messagesData = await fs.readFile(messagesFilePath, 'utf8');
        const usersData = await fs.readFile(usersFilePath, 'utf8');

        const messages = JSON.parse(messagesData);
        const users = JSON.parse(usersData);

        // Проверяем существование получателя
        const receiver = users.find(u => u.id === receiverId);
        if (!receiver) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Создаем новое сообщение
        const newMessage = {
            id: Math.max(...messages.map(m => m.id), 0) + 1,
            senderId: currentUserId,
            receiverId: receiverId,
            content: content.trim(),
            timestamp: new Date().toISOString(),
            read: false
        };

        messages.push(newMessage);
        await fs.writeFile(messagesFilePath, JSON.stringify(messages, null, 2));

        res.json({
            message: 'Message sent successfully',
            sentMessage: newMessage
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error sending message' });
    }
});

// Пометить сообщения как прочитанные
router.post('/read/:userId', ensureAuthenticated, async (req, res) => {
    try {
        const otherUserId = parseInt(req.params.userId);
        const currentUserId = req.user.id;

        const messagesData = await fs.readFile(messagesFilePath, 'utf8');
        const messages = JSON.parse(messagesData);

        const updatedMessages = messages.map(message => {
            if (message.senderId === otherUserId &&
                message.receiverId === currentUserId &&
                !message.read) {
                return { ...message, read: true };
            }
            return message;
        });

        await fs.writeFile(messagesFilePath, JSON.stringify(updatedMessages, null, 2));

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Error marking messages as read' });
    }
});