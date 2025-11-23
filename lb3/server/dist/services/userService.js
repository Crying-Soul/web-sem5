import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
export async function updateUser(id, updates) {
    const users = await getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1)
        return null;
    users[idx] = { ...users[idx], ...updates };
    await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2));
    return users[idx];
}
export async function deleteUser(id) {
    const users = await getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1)
        return false;
    users.splice(idx, 1);
    await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2));
    return true;
}
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
export async function loginUser(email, password) {
    const users = await getUsers();
    const user = users.find((u) => u.email === email);
    if (!user || !user.password)
        return null;
    const match = await bcrypt.compare(password, user.password);
    if (!match)
        return null;
    const token = jwt.sign({ id: user.id, role: user.role, status: user.status }, JWT_SECRET, { expiresIn: "2h" });
    // Возвращаем пользователя без поля password
    const { password: pwd, ...userData } = user;
    return { token, user: userData };
}
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const USERS_PATH = path.join(__dirname, "../../data/users.json");
export async function getUsers() {
    try {
        const data = await fs.readFile(USERS_PATH, "utf-8");
        return JSON.parse(data);
    }
    catch {
        return [];
    }
}
export async function addUser(user) {
    const users = await getUsers();
    if (users.find((u) => u.email === user.email)) {
        throw new Error("Email already registered");
    }
    if (!user.password) {
        throw new Error("Password is required");
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    let newId = "1";
    if (users.length > 0) {
        newId = (Math.max(...users.map((u) => Number(u.id))) + 1).toString();
    }
    const newUser = {
        id: newId,
        fullName: user.fullName || "",
        birthDate: user.birthDate || "",
        email: user.email || "",
        photo: user.photo || "",
        role: "user",
        status: "pending",
        password: hashedPassword,
    };
    users.push(newUser);
    await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2));
    return newUser;
}
