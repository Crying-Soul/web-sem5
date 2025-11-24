import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const messagesPath = path.join(__dirname, '../data/messages.json');
const usersPath = path.join(__dirname, '../data/users.json');

router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const messages = await fs.readJson(messagesPath);
        const users = await fs.readJson(usersPath);

        const userMessages = messages.filter(item =>
            item.senderId === userId || item.receiverId === userId
        );

        // Добавляем информацию об отправителях и получателях
        const messagesWithUsers = userMessages.map(item => {
            const sender = users.find(u => u.id === item.senderId);
            const receiver = users.find(u => u.id === item.receiverId);

            return {
                content:item.content,
                date: item.timeStamp,
                senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'Неизвестный',
                receiverName: receiver ? `${receiver.firstName} ${receiver.lastName}` : 'Неизвестный'
            };
        });

        res.json(messagesWithUsers);
    } catch (error) {
        console.error('Failed to load messages:', error);
        res.status(500).json({ error: 'Failed to load messages' });
    }
});

export default router;