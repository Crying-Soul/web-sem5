// messages.js - исправленная версия для JWT
import express from 'express';
import { authenticateToken } from '../routes/auth.route.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const messagesFilePath = path.join(__dirname, '../../../lb3/src/server/data/messages.json');
const usersFilePath = path.join(__dirname, '../../../lb3/src/server/data/users.json');

export const router = express.Router();

// Get conversations
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const [messagesData, usersData] = await Promise.all([
            fs.readFile(messagesFilePath, 'utf8'),
            fs.readFile(usersFilePath, 'utf8')
        ]);

        const messages = JSON.parse(messagesData);
        const users = JSON.parse(usersData);
        const currentUserId = req.user.id;

        // Find all users with conversations
        const conversationUserIds = new Set();
        messages.forEach(message => {
            if (message.senderId === currentUserId) {
                conversationUserIds.add(message.receiverId);
            } else if (message.receiverId === currentUserId) {
                conversationUserIds.add(message.senderId);
            }
        });

        // Add friends for potential new conversations
        const currentUser = users.find(u => u.id === currentUserId);
        if (currentUser && currentUser.friends) {
            currentUser.friends.forEach(friendId => {
                conversationUserIds.add(friendId);
            });
        }

        const conversations = Array.from(conversationUserIds)
            .map(userId => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;

                // Find last message
                const conversationMessages = messages.filter(m =>
                    (m.senderId === currentUserId && m.receiverId === userId) ||
                    (m.senderId === userId && m.receiverId === currentUserId)
                );

                const lastMessage = conversationMessages
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

                // Count unread messages
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
            })
            .filter(conv => conv !== null)
            .sort((a, b) => {
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

// Get conversation with specific user
router.get('/conversation/:userId', authenticateToken, async (req, res) => {
    try {
        const otherUserId = parseInt(req.params.userId);
        const currentUserId = req.user.id;

        const [messagesData, usersData] = await Promise.all([
            fs.readFile(messagesFilePath, 'utf8'),
            fs.readFile(usersFilePath, 'utf8')
        ]);

        const messages = JSON.parse(messagesData);
        const users = JSON.parse(usersData);

        // Check if user exists
        const otherUser = users.find(u => u.id === otherUserId);
        if (!otherUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get conversation messages
        const conversationMessages = messages
            .filter(message =>
                (message.senderId === currentUserId && message.receiverId === otherUserId) ||
                (message.senderId === otherUserId && message.receiverId === currentUserId)
            )
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Mark messages as read
        const updatedMessages = messages.map(msg => {
            if (msg.receiverId === currentUserId && msg.senderId === otherUserId && !msg.read) {
                return { ...msg, read: true };
            }
            return msg;
        });

        await fs.writeFile(messagesFilePath, JSON.stringify(updatedMessages, null, 2));

        const { password, ...otherUserWithoutPassword } = otherUser;
        res.json({
            user: otherUserWithoutPassword,
            messages: conversationMessages.map(msg => ({
                ...msg,
                read: msg.receiverId === currentUserId ? true : msg.read
            }))
        });
    } catch (error) {
        console.error('Error loading conversation:', error);
        res.status(500).json({ error: 'Error loading conversation' });
    }
});

// Send message
router.post('/send/:userId', authenticateToken, async (req, res) => {
    try {
        const receiverId = parseInt(req.params.userId);
        const { content } = req.body;
        const currentUserId = req.user.id;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const [messagesData, usersData] = await Promise.all([
            fs.readFile(messagesFilePath, 'utf8'),
            fs.readFile(usersFilePath, 'utf8')
        ]);

        const messages = JSON.parse(messagesData);
        const users = JSON.parse(usersData);

        // Check if receiver exists
        if (!users.find(u => u.id === receiverId)) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newMessage = {
            id: Math.max(0, ...messages.map(m => m.id)) + 1,
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

// Mark messages as read
router.post('/read/:userId', authenticateToken, async (req, res) => {
    try {
        const otherUserId = parseInt(req.params.userId);
        const currentUserId = req.user.id;

        const messagesData = await fs.readFile(messagesFilePath, 'utf8');
        const messages = JSON.parse(messagesData);

        const updatedMessages = messages.map(msg => {
            if (msg.senderId === otherUserId && msg.receiverId === currentUserId && !msg.read) {
                return { ...msg, read: true };
            }
            return msg;
        });

        await fs.writeFile(messagesFilePath, JSON.stringify(updatedMessages, null, 2));
        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Error marking messages as read' });
    }
});