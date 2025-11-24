import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersFilePath = path.join(__dirname, '../../../lab3/src/server/data/users.json');

export async function findUser(username) {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);
        return users.find(user => user.username === username);
    } catch (error) {
        return null;
    }
}

export async function findUserById(id) {
    try {
        const usersData = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);
        return users.find(user => user.id === parseInt(id));
    } catch (error) {
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
        throw error;
    }
}

// Стратегия Passport
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await findUser(username);

            if (!user) {
                return done(null, false, { message: 'Пользователь не найден' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Неверный пароль' });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await findUserById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

export function ensureAuthenticated(req, res, next) {
   // if (req.isAuthenticated()) {
        return next();
    //}
 //   res.status(401).json({ error: 'Not authenticated' });
}

export function ensureNotAuthenticated(req, res, next) {
     //if (!req.isAuthenticated()) {
        return next();
   // }
     // res.status(400).json({ error: 'Already authenticated' });
}

export { passport };