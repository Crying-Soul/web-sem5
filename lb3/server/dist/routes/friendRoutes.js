import { Router } from 'express';
import { getFriends, addFriend } from '../services/friendService.js';
const router = Router();
router.get('/', async (_req, res) => {
    const friends = await getFriends();
    res.json(friends);
});
router.post('/', async (req, res) => {
    const friend = req.body;
    const newFriend = await addFriend(friend);
    res.json(newFriend);
});
export default router;
