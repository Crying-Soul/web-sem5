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

export async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}