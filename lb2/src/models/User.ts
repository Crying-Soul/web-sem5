import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface User {
    id: string;
    username: string;
    password: string;
    email: string;
    createdAt: Date;
}

export class UserManager {
    private users: Map<string, User> = new Map();

    async createUser(username: string, password: string, email: string): Promise<User> {
        const id = uuidv4();
        const user: User = {
            id,
            username,
            password, // Password should already be hashed
            email,
            createdAt: new Date()
        };

        this.users.set(id, user);
        return user;
    }

    async findUserByUsername(username: string): Promise<User | undefined> {
        return Array.from(this.users.values()).find(user => user.username === username);
    }

    async findUserById(id: string): Promise<User | undefined> {
        return this.users.get(id);
    }

    async validatePassword(user: User, password: string): Promise<boolean> {
        return await bcrypt.compare(password, user.password);
    }


}