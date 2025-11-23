import { Router } from 'express';
import { getMessages, addMessage } from '../services/messageService.js';
import { Message } from '../models/message.js';

const router = Router();

router.get('/', async (_req, res) => {
  const messages = await getMessages();
  res.json(messages);
});

router.post('/', async (req, res) => {
  const message: Message = req.body;
  const newMessage = await addMessage(message);
  res.json(newMessage);
});

export default router;
