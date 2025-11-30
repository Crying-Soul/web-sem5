// friends.js - исправленная версия для JWT
import express from 'express';
import { authenticateToken } from '../routes/auth.route.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, '../../../lb3/src/server/data/users.json');
const friendsFilePath = path.join(__dirname, '../../../lb3/src/server/data/friends.json');

export const router = express.Router();

// Get all users with friendship status
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const [usersData, friendsData] = await Promise.all([
            fs.readFile(usersFilePath, 'utf8'),
            fs.readFile(friendsFilePath, 'utf8')
        ]);

        const users = JSON.parse(usersData);
        const friends = JSON.parse(friendsData);
        const currentUserId = req.user.id;

        const usersWithStatus = users
            .filter(u => u.id !== currentUserId)
            .map(user => {
                const friendship = friends.find(f =>
                    (f.userId === currentUserId && f.friendId === user.id && f.status === 'accepted') ||
                    (f.userId === user.id && f.friendId === currentUserId && f.status === 'accepted')
                );

                const pendingRequest = friends.find(f =>
                    f.userId === currentUserId && f.friendId === user.id && f.status === 'pending'
                );

                const incomingRequest = friends.find(f =>
                    f.userId === user.id && f.friendId === currentUserId && f.status === 'pending'
                );

                let status = 'none';
                if (friendship) status = 'friend';
                else if (pendingRequest) status = 'pending_outgoing';
                else if (incomingRequest) status = 'pending_incoming';

                const { password, ...userWithoutPassword } = user;
                return {
                    ...userWithoutPassword,
                    friendshipStatus: status,
                    requestId: pendingRequest?.id || incomingRequest?.id || null
                };
            });

        res.json({ users: usersWithStatus });
    } catch (error) {
        res.status(500).json({ error: 'Error loading users' });
    }
});

// Send friend request
router.post('/request/:friendId', authenticateToken, async (req, res) => {
    try {
        const friendId = parseInt(req.params.friendId);
        const currentUserId = req.user.id;

        const [usersData, friendsData] = await Promise.all([
            fs.readFile(usersFilePath, 'utf8'),
            fs.readFile(friendsFilePath, 'utf8')
        ]);

        const users = JSON.parse(usersData);
        const friends = JSON.parse(friendsData);

        // Check if user exists
        if (!users.find(u => u.id === friendId)) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check for existing request or friendship
        const existing = friends.find(f =>
            (f.userId === currentUserId && f.friendId === friendId) ||
            (f.userId === friendId && f.friendId === currentUserId)
        );

        if (existing) {
            return res.status(400).json({ error: 'Friend request already exists' });
        }

        const newRequest = {
            id: Math.max(0, ...friends.map(f => f.id)) + 1,
            userId: currentUserId,
            friendId: friendId,
            status: 'pending',
            date: new Date().toISOString()
        };

        friends.push(newRequest);
        await fs.writeFile(friendsFilePath, JSON.stringify(friends, null, 2));

        res.json({
            message: 'Friend request sent successfully',
            requestId: newRequest.id
        });
    } catch (error) {
        res.status(500).json({ error: 'Error sending friend request' });
    }
});

// Accept friend request
router.post('/accept/:requestId', authenticateToken, async (req, res) => {
    try {
        const requestId = parseInt(req.params.requestId);
        const currentUserId = req.user.id;

        const [usersData, friendsData] = await Promise.all([
            fs.readFile(usersFilePath, 'utf8'),
            fs.readFile(friendsFilePath, 'utf8')
        ]);

        const users = JSON.parse(usersData);
        const friends = JSON.parse(friendsData);

        const requestIndex = friends.findIndex(f =>
            f.id === requestId && f.friendId === currentUserId && f.status === 'pending'
        );

        if (requestIndex === -1) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        const request = friends[requestIndex];
        friends[requestIndex].status = 'accepted';

        // Update users' friends lists
        const user1Index = users.findIndex(u => u.id === request.userId);
        const user2Index = users.findIndex(u => u.id === request.friendId);

        if (user1Index !== -1 && user2Index !== -1) {
            if (!users[user1Index].friends.includes(request.friendId)) {
                users[user1Index].friends.push(request.friendId);
            }
            if (!users[user2Index].friends.includes(request.userId)) {
                users[user2Index].friends.push(request.userId);
            }
        }

        await Promise.all([
            fs.writeFile(usersFilePath, JSON.stringify(users, null, 2)),
            fs.writeFile(friendsFilePath, JSON.stringify(friends, null, 2))
        ]);

        res.json({ message: 'Friend request accepted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error accepting friend request' });
    }
});

// Reject friend request
router.delete('/reject/:requestId', authenticateToken, async (req, res) => {
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
        res.status(500).json({ error: 'Error rejecting friend request' });
    }
});

// Remove friend
router.delete('/remove/:friendId', authenticateToken, async (req, res) => {
    try {
        const friendId = parseInt(req.params.friendId);
        const currentUserId = req.user.id;

        const [usersData, friendsData] = await Promise.all([
            fs.readFile(usersFilePath, 'utf8'),
            fs.readFile(friendsFilePath, 'utf8')
        ]);

        const users = JSON.parse(usersData);
        const friends = JSON.parse(friendsData);

        // Remove friendship record
        const friendshipIndex = friends.findIndex(f =>
            ((f.userId === currentUserId && f.friendId === friendId) ||
                (f.userId === friendId && f.friendId === currentUserId)) &&
            f.status === 'accepted'
        );

        if (friendshipIndex !== -1) {
            friends.splice(friendshipIndex, 1);
        }

        // Update users' friends lists
        const user1Index = users.findIndex(u => u.id === currentUserId);
        const user2Index = users.findIndex(u => u.id === friendId);

        if (user1Index !== -1) {
            users[user1Index].friends = users[user1Index].friends.filter(id => id !== friendId);
        }
        if (user2Index !== -1) {
            users[user2Index].friends = users[user2Index].friends.filter(id => id !== currentUserId);
        }

        await Promise.all([
            fs.writeFile(usersFilePath, JSON.stringify(users, null, 2)),
            fs.writeFile(friendsFilePath, JSON.stringify(friends, null, 2))
        ]);

        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error removing friend' });
    }
});

// Get friend requests
router.get('/requests', authenticateToken, async (req, res) => {
    try {
        const [friendsData, usersData] = await Promise.all([
            fs.readFile(friendsFilePath, 'utf8'),
            fs.readFile(usersFilePath, 'utf8')
        ]);

        const friends = JSON.parse(friendsData);
        const users = JSON.parse(usersData);

        const incomingRequests = friends
            .filter(f => f.friendId === req.user.id && f.status === 'pending')
            .map(request => {
                const user = users.find(u => u.id === request.userId);
                const { password, ...userWithoutPassword } = user || {};
                return {
                    requestId: request.id,
                    user: userWithoutPassword,
                    date: request.date
                };
            })
            .filter(req => req.user); // Filter out requests with deleted users

        res.json({ requests: incomingRequests });
    } catch (error) {
        res.status(500).json({ error: 'Error loading friend requests' });
    }
});

// Get current friends
router.get('/', authenticateToken, async (req, res) => {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);
        const currentUser = users.find(u => u.id === req.user.id);

        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const friends = users
            .filter(u => currentUser.friends.includes(u.id))
            .map(({ password, ...user }) => user);

        res.json({ friends });
    } catch (error) {
        res.status(500).json({ error: 'Error loading friends' });
    }
});