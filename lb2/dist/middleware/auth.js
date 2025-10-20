import { Strategy as LocalStrategy } from 'passport-local';
import { UserManager } from '../models/User.js';
const userManager = new UserManager();
export const initPassport = (passport) => {
    passport.use(new LocalStrategy(async (username, password, done) => {
        try {
            const user = await userManager.findUserByUsername(username);
            if (!user) {
                return done(null, false, { message: 'Неверное имя пользователя.' });
            }
            const isValidPassword = await userManager.validatePassword(user, password);
            if (!isValidPassword) {
                return done(null, false, { message: 'Неверный пароль.' });
            }
            return done(null, user);
        }
        catch (error) {
            return done(error);
        }
    }));
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await userManager.findUserById(id);
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    });
};
export const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Пожалуйста, войдите для доступа к этой странице');
    res.redirect('/auth/login');
};
export const optionalAuth = (req, res, next) => {
    next();
};
export const requireAdmin = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Требуются права администратора');
    res.redirect('/auth/login');
};
//# sourceMappingURL=auth.js.map