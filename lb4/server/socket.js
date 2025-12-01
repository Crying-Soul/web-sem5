// socket.js - исправленная версия с правильной настройкой CORS
import { Server } from 'socket.io';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const messagesFilePath = path.join(__dirname, '../../lb3/src/server/data/messages.json');

const usersFilePath = path.join(__dirname, '../../lb3/src/server/data/users.json');
const friendsFilePath = path.join(__dirname, '../../lb3/src/server/data/friends.json');

export function setupWebSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:4200", "http://127.0.0.1:4200"],
            methods: ["GET", "POST"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"]
        },
        transports: ['websocket', 'polling'] // Явно указываем транспорты
    });

    const connectedUsers = new Map();

    // Вспомогательные функции для работы с файлами
    const readMessages = async () => {
        try {
            const data = await fs.readFile(messagesFilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading messages:', error);
            return [];
        }
    };

    const writeMessages = async (messages) => {
        try {
            await fs.writeFile(messagesFilePath, JSON.stringify(messages, null, 2));
            return true;
        } catch (error) {
            console.error('Error writing messages:', error);
            return false;
        }
    };

    const readUsers = async () => {
        try {
            const data = await fs.readFile(usersFilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading users:', error);
            return [];
        }
    };

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Client sends their ID when connecting
        socket.on('user_connected', (userId) => {
            console.log('User connected with ID:', userId);
            connectedUsers.set(userId, {
                socketId: socket.id,
                userId: userId
            });
            socket.userId = userId;
            socket.join(`user_${userId}`);

            // Отправляем подтверждение подключения
            socket.emit('connection_success', {
                message: 'WebSocket connected successfully',
                userId: userId
            });

            // Отправляем историю подключенных пользователей (для отладки)
            console.log(`Total connected users: ${connectedUsers.size}`);
        });

        // Handle message sending - ИСПРАВЛЕННАЯ ВЕРСИЯ
        socket.on('send_message', async (data, callback) => {
            try {
                const { receiverId, content, tempId } = data;

                if (!socket.userId) {
                    const errorResponse = {
                        error: 'User not identified',
                        tempId: tempId
                    };
                    socket.emit('message_error', errorResponse);
                    if (callback) callback(errorResponse);
                    return;
                }

                if (!content || content.trim() === '') {
                    const errorResponse = {
                        error: 'Message content is empty',
                        tempId: tempId
                    };
                    socket.emit('message_error', errorResponse);
                    if (callback) callback(errorResponse);
                    return;
                }

                // Проверяем существование получателя
                const users = await readUsers();
                const receiverExists = users.some(user => user.id === receiverId);
                if (!receiverExists) {
                    const errorResponse = {
                        error: 'Receiver not found',
                        tempId: tempId
                    };
                    socket.emit('message_error', errorResponse);
                    if (callback) callback(errorResponse);
                    return;
                }

                // Read current messages from file
                const messages = await readMessages();

                const newMessage = {
                    id: Math.max(0, ...messages.map(m => m.id)) + 1,
                    senderId: socket.userId,
                    receiverId: receiverId,
                    content: content.trim(),
                    timestamp: new Date().toISOString(),
                    read: false
                };

                // Save to file
                messages.push(newMessage);
                const saveSuccess = await writeMessages(messages);

                if (!saveSuccess) {
                    throw new Error('Failed to save message to file');
                }

                // Send confirmation to sender with both tempId and permanent message
                const successResponse = {
                    tempId: tempId,
                    message: newMessage,
                    success: true
                };

                socket.emit('message_sent', successResponse);
                if (callback) callback(successResponse);

                // Send message to receiver if online
                const receiver = connectedUsers.get(receiverId);
                if (receiver) {
                    io.to(receiver.socketId).emit('new_message', {
                        message: newMessage,
                        senderId: socket.userId
                    });
                    console.log(`Message delivered to online user ${receiverId}`);
                } else {
                    console.log(`User ${receiverId} is offline, message saved for later`);
                }

                // Также отправляем сообщение в комнату для групповой синхронизации
                socket.to(`user_${receiverId}`).emit('new_message', {
                    message: newMessage,
                    senderId: socket.userId
                });

            } catch (error) {
                console.error('Error sending message:', error);
                const errorResponse = {
                    error: 'Failed to send message',
                    tempId: data.tempId
                };
                socket.emit('message_error', errorResponse);
                if (callback) callback(errorResponse);
            }
        });

        // Handle message read status - ИСПРАВЛЕННАЯ ВЕРСИЯ
        socket.on('mark_as_read', async (data, callback) => {
            try {
                const { senderId, messageIds } = data;

                if (!socket.userId) {
                    if (callback) callback({ error: 'User not identified' });
                    return;
                }

                // Read current messages
                const messages = await readMessages();

                // Mark specific messages as read или все от отправителя
                let hasUpdates = false;
                const updatedMessages = messages.map(msg => {
                    if (messageIds && messageIds.includes(msg.id)) {
                        // Пометить конкретные сообщения
                        if (!msg.read && msg.receiverId === socket.userId) {
                            hasUpdates = true;
                            return { ...msg, read: true };
                        }
                    } else if (!messageIds && msg.senderId === senderId && msg.receiverId === socket.userId && !msg.read) {
                        // Пометить все непрочитанные от отправителя
                        hasUpdates = true;
                        return { ...msg, read: true };
                    }
                    return msg;
                });

                if (hasUpdates) {
                    // Save updated messages
                    await writeMessages(updatedMessages);

                    // Notify sender that messages were read
                    const sender = connectedUsers.get(senderId);
                    if (sender) {
                        io.to(sender.socketId).emit('messages_read', {
                            readerId: socket.userId,
                            messageIds: messageIds || updatedMessages
                                .filter(msg => msg.senderId === senderId &&
                                    msg.receiverId === socket.userId &&
                                    msg.read)
                                .map(msg => msg.id)
                        });
                    }
                }

                if (callback) callback({ success: true, updated: hasUpdates });

            } catch (error) {
                console.error('Error marking messages as read:', error);
                if (callback) callback({ error: 'Error marking messages as read' });
            }
        });

        // Новый эндпоинт для получения непрочитанных сообщений
        socket.on('get_unread_messages', async (callback) => {
            try {
                if (!socket.userId) {
                    if (callback) callback({ error: 'User not identified' });
                    return;
                }

                const messages = await readMessages();
                const unreadMessages = messages.filter(msg =>
                    msg.receiverId === socket.userId && !msg.read
                );

                if (callback) callback({ unreadMessages, count: unreadMessages.length });
            } catch (error) {
                console.error('Error getting unread messages:', error);
                if (callback) callback({ error: 'Error getting unread messages' });
            }
        });

        // Handle friend request
        socket.on('send_friend_request', async (data, callback) => {
            try {
                const { friendId } = data;

                if (!socket.userId) {
                    if (callback) callback({ error: 'User not identified' });
                    return;
                }

                // Read current data
                const [friendsData, usersData] = await Promise.all([
                    fs.readFile(friendsFilePath, 'utf8'),
                    fs.readFile(usersFilePath, 'utf8')
                ]);

                const friends = JSON.parse(friendsData);
                const users = JSON.parse(usersData);

                // Check if user exists
                if (!users.find(u => u.id === friendId)) {
                    if (callback) callback({ error: 'User not found' });
                    return;
                }

                // Check for existing request or friendship
                const existing = friends.find(f =>
                    (f.userId === socket.userId && f.friendId === friendId) ||
                    (f.userId === friendId && f.friendId === socket.userId)
                );

                if (existing) {
                    if (callback) callback({ error: 'Friend request already exists' });
                    return;
                }

                const newRequest = {
                    id: Math.max(0, ...friends.map(f => f.id)) + 1,
                    userId: socket.userId,
                    friendId: friendId,
                    status: 'pending',
                    date: new Date().toISOString()
                };

                friends.push(newRequest);
                await fs.writeFile(friendsFilePath, JSON.stringify(friends, null, 2));

                // Notify receiver
                const receiver = connectedUsers.get(friendId);
                if (receiver) {
                    io.to(receiver.socketId).emit('new_friend_request', {
                        requestId: newRequest.id,
                        fromUserId: socket.userId
                    });
                }

                if (callback) {
                    callback({
                        message: 'Friend request sent successfully',
                        requestId: newRequest.id
                    });
                }

            } catch (error) {
                console.error('Error sending friend request:', error);
                if (callback) callback({ error: 'Error sending friend request' });
            }
        });

        // Handle accept friend request
        socket.on('accept_friend_request', async (data, callback) => {
            try {
                const { requestId } = data;

                if (!socket.userId) {
                    if (callback) callback({ error: 'User not identified' });
                    return;
                }

                const [usersData, friendsData] = await Promise.all([
                    fs.readFile(usersFilePath, 'utf8'),
                    fs.readFile(friendsFilePath, 'utf8')
                ]);

                const users = JSON.parse(usersData);
                const friends = JSON.parse(friendsData);

                const requestIndex = friends.findIndex(f =>
                    f.id === requestId && f.friendId === socket.userId && f.status === 'pending'
                );

                if (requestIndex === -1) {
                    if (callback) callback({ error: 'Friend request not found' });
                    return;
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

                // Notify both users
                const sender = connectedUsers.get(request.userId);
                if (sender) {
                    io.to(sender.socketId).emit('friend_request_accepted', {
                        requestId: requestId,
                        byUserId: socket.userId
                    });
                }

                if (callback) callback({ message: 'Friend request accepted successfully' });

            } catch (error) {
                console.error('Error accepting friend request:', error);
                if (callback) callback({ error: 'Error accepting friend request' });
            }
        });

        // Handle reject friend request
        socket.on('reject_friend_request', async (data, callback) => {
            try {
                const { requestId } = data;

                if (!socket.userId) {
                    if (callback) callback({ error: 'User not identified' });
                    return;
                }

                const friendsData = await fs.readFile(friendsFilePath, 'utf8');
                const friends = JSON.parse(friendsData);

                const requestIndex = friends.findIndex(f =>
                    f.id === requestId && f.friendId === socket.userId && f.status === 'pending'
                );

                if (requestIndex === -1) {
                    if (callback) callback({ error: 'Friend request not found' });
                    return;
                }

                const request = friends[requestIndex];
                friends.splice(requestIndex, 1);
                await fs.writeFile(friendsFilePath, JSON.stringify(friends, null, 2));

                // Notify sender
                const sender = connectedUsers.get(request.userId);
                if (sender) {
                    io.to(sender.socketId).emit('friend_request_rejected', {
                        requestId: requestId,
                        byUserId: socket.userId
                    });
                }

                if (callback) callback({ message: 'Friend request rejected successfully' });

            } catch (error) {
                console.error('Error rejecting friend request:', error);
                if (callback) callback({ error: 'Error rejecting friend request' });
            }
        });

        // Handle remove friend
        socket.on('remove_friend', async (data, callback) => {
            try {
                const { friendId } = data;

                if (!socket.userId) {
                    if (callback) callback({ error: 'User not identified' });
                    return;
                }

                const [usersData, friendsData] = await Promise.all([
                    fs.readFile(usersFilePath, 'utf8'),
                    fs.readFile(friendsFilePath, 'utf8')
                ]);

                const users = JSON.parse(usersData);
                const friends = JSON.parse(friendsData);

                // Remove friendship record
                const friendshipIndex = friends.findIndex(f =>
                    ((f.userId === socket.userId && f.friendId === friendId) ||
                        (f.userId === friendId && f.friendId === socket.userId)) &&
                    f.status === 'accepted'
                );

                if (friendshipIndex !== -1) {
                    friends.splice(friendshipIndex, 1);
                }

                // Update users' friends lists
                const user1Index = users.findIndex(u => u.id === socket.userId);
                const user2Index = users.findIndex(u => u.id === friendId);

                if (user1Index !== -1) {
                    users[user1Index].friends = users[user1Index].friends.filter(id => id !== friendId);
                }
                if (user2Index !== -1) {
                    users[user2Index].friends = users[user2Index].friends.filter(id => id !== socket.userId);
                }

                await Promise.all([
                    fs.writeFile(usersFilePath, JSON.stringify(users, null, 2)),
                    fs.writeFile(friendsFilePath, JSON.stringify(friends, null, 2))
                ]);

                // Notify other user
                const otherUser = connectedUsers.get(friendId);
                if (otherUser) {
                    io.to(otherUser.socketId).emit('friend_removed', {
                        byUserId: socket.userId
                    });
                }

                if (callback) callback({ message: 'Friend removed successfully' });

            } catch (error) {
                console.error('Error removing friend:', error);
                if (callback) callback({ error: 'Error removing friend' });
            }
        });

        // Handle cancel friend request
        socket.on('cancel_friend_request', async (data, callback) => {
            try {
                const { requestId } = data;

                if (!socket.userId) {
                    if (callback) callback({ error: 'User not identified' });
                    return;
                }

                const friendsData = await fs.readFile(friendsFilePath, 'utf8');
                const friends = JSON.parse(friendsData);

                const requestIndex = friends.findIndex(f =>
                    f.id === requestId && f.userId === socket.userId && f.status === 'pending'
                );

                if (requestIndex === -1) {
                    if (callback) callback({ error: 'Friend request not found' });
                    return;
                }

                const request = friends[requestIndex];
                friends.splice(requestIndex, 1);
                await fs.writeFile(friendsFilePath, JSON.stringify(friends, null, 2));

                if (callback) callback({ message: 'Friend request cancelled successfully' });

            } catch (error) {
                console.error('Error cancelling friend request:', error);
                if (callback) callback({ error: 'Error cancelling friend request' });
            }
        });

        // Handle disconnect
        socket.on('disconnect', (reason) => {
            console.log('User disconnected:', socket.id, 'Reason:', reason);
            if (socket.userId) {
                connectedUsers.delete(socket.userId);
                console.log(`User ${socket.userId} disconnected. Total connected: ${connectedUsers.size}`);
            }
        });

        // Handle connection errors
        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        // Ping для проверки соединения
        socket.on('ping', (callback) => {
            if (callback) callback({ pong: Date.now() });
        });
    });

    console.log('WebSocket server initialized successfully');
    return io;
}