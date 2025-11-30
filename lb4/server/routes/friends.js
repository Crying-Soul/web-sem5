import express from 'express';
import { ensureAuthenticated } from '../middleware/auth.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, '../../../lb3/src/server/data/users.json');
const friendsFilePath = path.join(__dirname, '../../../lb3/src/server/data/friends.json');

export const router = express.Router();

// Получить всех пользователей с информацией о статусе дружбы
router.get('/users', ensureAuthenticated, async (req, res) => {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const friendsData = await fs.readFile(friendsFilePath, 'utf8');

        const users = JSON.parse(usersData);
        const friends = JSON.parse(friendsData);

        const currentUserId = req.user.id;
        const userFriends = friends.filter(f =>
            (f.userId === currentUserId || f.friendId === currentUserId) && f.status === 'accepted'
        );
        const pendingRequests = friends.filter(f =>
            f.friendId === currentUserId && f.status === 'pending'
        );
        const sentRequests = friends.filter(f =>
            f.userId === currentUserId && f.status === 'pending'
        );

        const usersWithStatus = users
            .filter(u => u.id !== currentUserId)
            .map(user => {
                const friendship = userFriends.find(f =>
                    f.userId === user.id || f.friendId === user.id
                );
                const pendingRequest = pendingRequests.find(f => f.userId === user.id);
                const sentRequest = sentRequests.find(f => f.friendId === user.id);

                let status = 'none';
                if (friendship) status = 'friend';
                else if (pendingRequest) status = 'pending_incoming';
                else if (sentRequest) status = 'pending_outgoing';

                const { password, ...userWithoutPassword } = user;
                return {
                    ...userWithoutPassword,
                    friendshipStatus: status,
                    requestId: pendingRequest ? pendingRequest.id : (sentRequest ? sentRequest.id : null)
                };
            });

        res.json({ users: usersWithStatus });
    } catch (error) {
        console.error('Error loading users:', error);
        res.status(500).json({ error: 'Error loading users' });
    }
});

// Отправить заявку в друзья
router.post('/request/:friendId', ensureAuthenticated, async (req, res) => {
    try {
        const friendId = parseInt(req.params.friendId);
        const currentUserId = req.user.id;

        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const friendsData = await fs.readFile(friendsFilePath, 'utf8');

        const users = JSON.parse(usersData);
        const friends = JSON.parse(friendsData);

        const friendExists = users.find(u => u.id === friendId);
        if (!friendExists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const existingRequest = friends.find(f =>
            f.userId === currentUserId && f.friendId === friendId
        );
        if (existingRequest) {
            return res.status(400).json({ error: 'Friend request already sent' });
        }

        const existingFriendship = friends.find(f =>
            ((f.userId === currentUserId && f.friendId === friendId) ||
                (f.userId === friendId && f.friendId === currentUserId)) &&
            f.status === 'accepted'
        );
        if (existingFriendship) {
            return res.status(400).json({ error: 'Already friends' });
        }

        const newRequest = {
            id: Math.max(...friends.map(f => f.id), 0) + 1,
            userId: currentUserId,
            friendId: friendId,
            status: 'pending',
            date: new Date().toISOString().split('T')[0]
        };

        friends.push(newRequest);
        await fs.writeFile(friendsFilePath, JSON.stringify(friends, null, 2));

        res.json({
            message: 'Friend request sent successfully',
            requestId: newRequest.id
        });
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ error: 'Error sending friend request' });
    }
});

// Принять заявку в друзья
router.post('/accept/:requestId', ensureAuthenticated, async (req, res) => {
    try {
        const requestId = parseInt(req.params.requestId);

        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const friendsData = await fs.readFile(friendsFilePath, 'utf8');

        const users = JSON.parse(usersData);
        const friends = JSON.parse(friendsData);

        const requestIndex = friends.findIndex(f =>
            f.id === requestId && f.friendId === req.user.id && f.status === 'pending'
        );

        if (requestIndex === -1) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        const request = friends[requestIndex];
        friends[requestIndex].status = 'accepted';

        const user1Index = users.findIndex(u => u.id === request.userId);
        const user2Index = users.findIndex(u => u.id === request.friendId);

        if (user1Index !== -1 && user2Index !== -1) {
            if (!users[user1Index].friends.includes(request.friendId)) {
                users[user1Index].friends.push(request.friendId);
            }
            if (!users[user2Index].friends.includes(request.userId)) {
                users[user2Index].friends.push(request.userId);
            }

            await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
            await fs.writeFile(friendsFilePath, JSON.stringify(friends, null, 2));

            res.json({ message: 'Friend request accepted successfully' });
        } else {
            res.status(404).json({ error: 'Users not found' });
        }
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ error: 'Error accepting friend request' });
    }
});

// Отклонить заявку в друзья
router.delete('/reject/:requestId', ensureAuthenticated, async (req, res) => {
    try {
        const requestId = parseInt(req.params.requestId);

        const friendsData = await fs.readFile(friendsFilePath, 'utf8');
        const friends = JSON.parse(friendsData);

        const requestIndex = friends.findIndex(f =>
            f.id === requestId && f.friendId === req.user.id && f.status === 'pending'
        );

        if (requestIndex === -1) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        friends.splice(requestIndex, 1);
        await fs.writeFile(friendsFilePath, JSON.stringify(friends, null, 2));

        res.json({ message: 'Friend request rejected successfully' });
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        res.status(500).json({ error: 'Error rejecting friend request' });
    }
});

// Удалить из друзей
router.delete('/remove/:friendId', ensureAuthenticated, async (req, res) => {
    try {
        const friendId = parseInt(req.params.friendId);
        const currentUserId = req.user.id;

        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const friendsData = await fs.readFile(friendsFilePath, 'utf8');

        const users = JSON.parse(usersData);
        const friends = JSON.parse(friendsData);

        const friendshipIndex = friends.findIndex(f =>
            ((f.userId === currentUserId && f.friendId === friendId) ||
                (f.userId === friendId && f.friendId === currentUserId)) &&
            f.status === 'accepted'
        );

        if (friendshipIndex === -1) {
            return res.status(404).json({ error: 'Friendship not found' });
        }

        friends.splice(friendshipIndex, 1);

        const user1Index = users.findIndex(u => u.id === currentUserId);
        const user2Index = users.findIndex(u => u.id === friendId);

        if (user1Index !== -1) {
            users[user1Index].friends = users[user1Index].friends.filter(id => id !== friendId);
        }
        if (user2Index !== -1) {
            users[user2Index].friends = users[user2Index].friends.filter(id => id !== currentUserId);
        }

        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
        await fs.writeFile(friendsFilePath, JSON.stringify(friends, null, 2));

        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ error: 'Error removing friend' });
    }
});

// Отменить исходящую заявку
router.delete('/cancel/:requestId', ensureAuthenticated, async (req, res) => {
    try {
        const requestId = parseInt(req.params.requestId);

        const friendsData = await fs.readFile(friendsFilePath, 'utf8');
        const friends = JSON.parse(friendsData);

        const requestIndex = friends.findIndex(f =>
            f.id === requestId && f.userId === req.user.id && f.status === 'pending'
        );

        if (requestIndex === -1) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        friends.splice(requestIndex, 1);
        await fs.writeFile(friendsFilePath, JSON.stringify(friends, null, 2));

        res.json({ message: 'Friend request cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling friend request:', error);
        res.status(500).json({ error: 'Error cancelling friend request' });
    }
});

// Получить входящие заявки в друзья
router.get('/requests', ensureAuthenticated, async (req, res) => {
    try {
        const friendsData = await fs.readFile(friendsFilePath, 'utf8');
        const usersData = await fs.readFile(usersFilePath, 'utf8');

        const friends = JSON.parse(friendsData);
        const users = JSON.parse(usersData);

        const incomingRequests = friends
            .filter(f => f.friendId === req.user.id && f.status === 'pending')
            .map(request => {
                const user = users.find(u => u.id === request.userId);
                const { password, ...userWithoutPassword } = user;
                return {
                    requestId: request.id,
                    user: userWithoutPassword,
                    date: request.date
                };
            });

        res.json({ requests: incomingRequests });
    } catch (error) {
        console.error('Error loading friend requests:', error);
        res.status(500).json({ error: 'Error loading friend requests' });
    }
});

// Получить текущих друзей
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const friendsData = await fs.readFile(friendsFilePath, 'utf8');

        const users = JSON.parse(usersData);
        const friends = JSON.parse(friendsData);

        const currentUser = users.find(u => u.id === req.user.id);

        if (currentUser) {
            const friendUsers = users
                .filter(u => currentUser.friends.includes(u.id))
                .map(({ password, ...user }) => user);

            res.json({ friends: friendUsers });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error loading friends:', error);
        res.status(500).json({ error: 'Error loading friends' });
    }
});