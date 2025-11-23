import { Router } from 'express';
import { getUsers, addUser, updateUser, deleteUser, loginUser } from '../services/userService.js';
const router = Router();
// Регистрация
router.post('/register', async (req, res) => {
    try {
        const { fullName, birthDate, email, password, photo } = req.body;
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const newUser = await addUser({ fullName, birthDate, email, password, photo });
        res.status(201).json(newUser);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Логин
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }
        const result = await loginUser(email, password);
        if (!result) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/', async (_req, res) => {
    const users = await getUsers();
    res.json(users.map(({ password, ...u }) => u));
});
router.post('/', async (req, res) => {
    const user = req.body;
    const newUser = await addUser(user);
    res.json(newUser);
});
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const updates = req.body;
    const updated = await updateUser(id, updates);
    if (updated) {
        const { password, ...u } = updated;
        res.json(u);
    }
    else {
        res.status(404).json({ error: 'User not found' });
    }
});
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const deleted = await deleteUser(id);
    if (deleted) {
        res.json({ success: true });
    }
    else {
        res.status(404).json({ error: 'User not found' });
    }
});
// Смена роли пользователя (только для админа)
router.patch('/:id/role', async (req, res) => {
    const id = req.params.id;
    const { role } = req.body;
    if (!role) {
        return res.status(400).json({ error: 'Role is required' });
    }
    const updated = await updateUser(id, { role });
    if (updated) {
        const { password, ...u } = updated;
        res.json(u);
    }
    else {
        res.status(404).json({ error: 'User not found' });
    }
});
// Смена статуса пользователя (только для админа)
router.patch('/:id/status', async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    const updated = await updateUser(id, { status });
    if (updated) {
        const { password, ...u } = updated;
        res.json(u);
    }
    else {
        res.status(404).json({ error: 'User not found' });
    }
});
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const updates = req.body;
    const updated = await updateUser(id, updates);
    if (updated) {
        res.json(updated);
    }
    else {
        res.status(404).json({ error: 'User not found' });
    }
});
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const deleted = await deleteUser(id);
    if (deleted) {
        res.json({ success: true });
    }
    else {
        res.status(404).json({ error: 'User not found' });
    }
});
export default router;
