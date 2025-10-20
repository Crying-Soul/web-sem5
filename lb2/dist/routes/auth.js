import { Router } from 'express';
import passport from 'passport';
import { UserManager } from '../models/User.js';
import bcrypt from 'bcryptjs';
const router = Router();
const userManager = new UserManager();
// Страница входа
router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: 'Вход - Библиотека',
        currentPath: req.path,
        messages: req.flash()
    });
});
// Обработчик входа
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user) {
            req.flash('error', info.message);
            return res.redirect('/auth/login');
        }
        req.logIn(user, (err) => {
            if (err)
                return next(err);
            req.flash('success', 'Вы успешно вошли в систему!');
            return res.redirect('/');
        });
    })(req, res, next);
});
// Обработчик выхода
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err)
            return next(err);
        req.flash('success', 'Вы успешно вышли из системы!');
        res.redirect('/');
    });
});
// Страница регистрации
router.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Регистрация - Библиотека',
        currentPath: req.path,
        messages: req.flash()
    });
});
// Обработчик регистрации
router.post('/register', async (req, res, next) => {
    try {
        const { username, password, email } = req.body;
        // Базовая валидация
        if (!username || !password || !email) {
            req.flash('error', 'Все поля обязательны для заполнения');
            return res.redirect('/auth/register');
        }
        if (password.length < 6) {
            req.flash('error', 'Пароль должен содержать не менее 6 символов');
            return res.redirect('/auth/register');
        }
        // Проверка существования пользователя
        const existingUser = await userManager.findUserByUsername(username);
        if (existingUser) {
            req.flash('error', 'Пользователь с таким именем уже существует');
            return res.redirect('/auth/register');
        }
        // Хеширование пароля перед сохранением
        const hashedPassword = await bcrypt.hash(password, 12);
        // Создание пользователя с хешированным паролем
        const user = await userManager.createUser(username, hashedPassword, email);
        req.flash('success', 'Регистрация прошла успешно! Пожалуйста, войдите.');
        res.redirect('/auth/login');
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=auth.js.map