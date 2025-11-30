// auth.js - исправленная версия
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersFilePath = path.join(__dirname, '../../../lb3/src/server/data/users.json');

export async function findUser(username) {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);
        return users.find(user => user.username === username);
    } catch (error) {
        console.error('Error finding user:', error);
        return null;
    }
}

export async function findUserById(id) {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);
        // Преобразуем ID в число для сравнения
        const user = users.find(user => user.id === parseInt(id));
        console.log('findUserById result for', id, ':', user ? user.username : 'not found');
        return user;
    } catch (error) {
        console.error('Error finding user by ID:', error);
        return null;
    }
}

export async function createUser(userData) { 
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);

        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            ...userData,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
        return newUser;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

// Стратегия Passport (исправленная)
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            console.log('Passport LocalStrategy attempt for username:', username);
            const user = await findUser(username);

            if (!user) {
                console.log('User not found:', username);
                return done(null, false, { message: 'Пользователь не найден' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                console.log('Invalid password for user:', username);
                return done(null, false, { message: 'Неверный пароль' });
            }

            console.log('User authenticated successfully:', user.username);
            return done(null, user);
        } catch (error) {
            console.error('Passport authentication error:', error);
            return done(error);
        }
    }
));

passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id, user.username);
    // Сохраняем только ID пользователя в сессии
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        console.log('Deserializing user ID:', id);
        const user = await findUserById(id);
        if (!user) {
            console.log('User not found during deserialization:', id);
            return done(null, false);
        }
        
        // Убираем пароль из объекта пользователя
        const { password, ...userWithoutPassword } = user;
        console.log('User deserialized successfully:', userWithoutPassword.username);
        
        done(null, userWithoutPassword);
    } catch (error) {
        console.error('Deserialization error:', error);
        done(error, null);
    }
});

// Middleware для проверки аутентификации (улучшенная)
export function ensureAuthenticated(req, res, next) {
    console.log('=== ensureAuthenticated CHECK ===');
    console.log('isAuthenticated():', req.isAuthenticated());
    console.log('User:', req.user);
    console.log('Session ID:', req.sessionID);
    console.log('==============================');
    
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }   
    
    console.log('Access denied: not authenticated');
    return res.status(401).json({ 
        error: 'Not authenticated',
        details: 'Please log in to access this resource'
    });
}

export function ensureNotAuthenticated(req, res, next) {
    console.log('ensureNotAuthenticated check:', req.isAuthenticated());
    
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return next();
    }
    
    console.log('Access denied: already authenticated');
    return res.status(400).json({ 
        error: 'Already authenticated',
        details: 'Please log out first'
    });
}

export { passport };