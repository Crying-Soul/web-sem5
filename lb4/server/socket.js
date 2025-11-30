import { Server } from 'socket.io';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const messagesFilePath = path.join(__dirname, '../../lb3/src/server/data/messages.json');

export function setupWebSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "https://localhost:4200",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    const connectedUsers = new Map();

    io.on('connection', (socket) => {

        // Клиент отправляет свой ID при подключении
        socket.on('user_connected', (userId) => {
            connectedUsers.set(userId, {
                socketId: socket.id,
                userId: userId
            });

            socket.userId = userId;
            socket.join(`user_${userId}`);
        });

        // Обработка отправки сообщения
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

                // Читаем текущие сообщения из файла
                const messagesData = await fs.readFile(messagesFilePath, 'utf8');
                const messages = JSON.parse(messagesData);

                // Создаем новое сообщение
                const newMessage = {
                    id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
                    senderId: socket.userId,
                    receiverId: receiverId,
                    content: content,
                    timestamp: new Date().toISOString(),
                    read: false
                };

                // Сохраняем в файл
                messages.push(newMessage);
                await fs.writeFile(messagesFilePath, JSON.stringify(messages, null, 2));

                // Отправляем подтверждение отправителю
                socket.emit('message_sent', {
                    tempId: tempId,
                    message: newMessage
                });

                // Отправляем сообщение получателю, если он онлайн
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

        // Обработка прочтения сообщений
        socket.on('mark_as_read', async (data) => {
            try {
                const { senderId } = data;

                if (!socket.userId) return;

                // Читаем текущие сообщения из файла
                const messagesData = await fs.readFile(messagesFilePath, 'utf8');
                const messages = JSON.parse(messagesData);

                // Помечаем сообщения как прочитанные
                let updated = false;
                const updatedMessages = messages.map(msg => {
                    if (msg.senderId === senderId && msg.receiverId === socket.userId && !msg.read) {
                        updated = true;
                        return { ...msg, read: true };
                    }
                    return msg;
                });

                // Сохраняем обновленные сообщения
                if (updated) {
                    await fs.writeFile(messagesFilePath, JSON.stringify(updatedMessages, null, 2));

                    // Уведомляем отправителя, что сообщения прочитаны
                    const sender = connectedUsers.get(senderId);
                    if (sender) {
                        io.to(sender.socketId).emit('messages_read', {
                            readerId: socket.userId
                        });
                    }
                }

            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        // Обработка отключения
        socket.on('disconnect', () => {
            if (socket.userId) {
                connectedUsers.delete(socket.userId);
            }
        });
    });

    return io;
}