// socket.js - исправленная версия
import { Server } from 'socket.io';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const messagesFilePath = path.join(__dirname, '../data/messages.json');

export function setupWebSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:4200", "http://127.0.0.1:4200"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    const connectedUsers = new Map();

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
        });

        // Handle message sending
        socket.on('send_message', async (data) => {
            try {
                const { receiverId, content, tempId } = data;

                if (!socket.userId) {
                    socket.emit('message_error', {
                        error: 'User not identified',
                        tempId: tempId
                    });
                    return;
                }

                // Read current messages from file
                const messagesData = await fs.readFile(messagesFilePath, 'utf8');
                const messages = JSON.parse(messagesData);

                // Create new message
                const newMessage = {
                    id: Math.max(0, ...messages.map(m => m.id)) + 1,
                    senderId: socket.userId,
                    receiverId: receiverId,
                    content: content,
                    timestamp: new Date().toISOString(),
                    read: false
                };

                // Save to file
                messages.push(newMessage);
                await fs.writeFile(messagesFilePath, JSON.stringify(messages, null, 2));

                // Send confirmation to sender
                socket.emit('message_sent', {
                    tempId: tempId,
                    message: newMessage
                });

                // Send message to receiver if online
                const receiver = connectedUsers.get(receiverId);
                if (receiver) {
                    io.to(receiver.socketId).emit('new_message', {
                        message: newMessage,
                        senderId: socket.userId
                    });
                }

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message_error', {
                    error: 'Failed to send message',
                    tempId: data.tempId
                });
            }
        });

        // Handle message read status
        socket.on('mark_as_read', async (data) => {
            try {
                const { senderId } = data;

                if (!socket.userId) return;

                // Read current messages
                const messagesData = await fs.readFile(messagesFilePath, 'utf8');
                const messages = JSON.parse(messagesData);

                // Mark messages as read
                const updatedMessages = messages.map(msg => {
                    if (msg.senderId === senderId && msg.receiverId === socket.userId && !msg.read) {
                        return { ...msg, read: true };
                    }
                    return msg;
                });

                // Save updated messages
                await fs.writeFile(messagesFilePath, JSON.stringify(updatedMessages, null, 2));

                // Notify sender that messages were read
                const sender = connectedUsers.get(senderId);
                if (sender) {
                    io.to(sender.socketId).emit('messages_read', {
                        readerId: socket.userId
                    });
                }

            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            if (socket.userId) {
                connectedUsers.delete(socket.userId);
            }
        });
    });

    return io;
}