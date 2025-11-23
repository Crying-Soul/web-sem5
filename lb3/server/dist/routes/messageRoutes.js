import { Router } from 'express';
import { getMessages, addMessage } from '../services/messageService.js';
const router = Router();
router.get('/', async (_req, res) => {
    const messages = await getMessages();
    res.json(messages);
});
router.post('/', async (req, res) => {
    const message = req.body;
    const newMessage = await addMessage(message);
    res.json(newMessage);
});
export default router;
