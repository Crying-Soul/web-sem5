import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
export class UserManager {
    users = new Map();
    async createUser(username, password, email) {
        const id = uuidv4();
        const user = {
            id,
            username,
            password, // Password should already be hashed
            email,
            createdAt: new Date()
        };
        this.users.set(id, user);
        return user;
    }
    async findUserByUsername(username) {
        return Array.from(this.users.values()).find(user => user.username === username);
    }
    async findUserById(id) {
        return this.users.get(id);
    }
    async validatePassword(user, password) {
        return await bcrypt.compare(password, user.password);
    }
}
//# sourceMappingURL=User.js.map