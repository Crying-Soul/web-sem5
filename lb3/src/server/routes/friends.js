import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const usersPath = path.join(__dirname, '../data/users.json');
const friendsPath = path.join(__dirname, '../data/friends.json');

router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const users = await fs.readJson(usersPath);
        const friendsData = await fs.readJson(friendsPath);

        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userFriends = friendsData.filter(friendship =>
            friendship.userId === userId || friendship.friendId === userId
        );
        const friendDetails = userFriends
            .map(friendship => {
                const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;
                const friend = users.find(u => u.id === friendId);
                return friend ? {
                    ...friend,
                    friendshipDate: friendship.date
                } : null;
            })
            .filter((friend, index, self) =>
                // Оставляем только уникальные ID
                index === self.findIndex(f => f.id === friend.id)
            );

        res.json(friendDetails);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load friends' });
    }
});

export default router;