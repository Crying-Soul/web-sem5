import express from "express";
import jwt from "jsonwebtoken";
import { createUser, findUser, findUserById, verifyPassword, hashPassword } from "../middleware/auth.js";

export const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key-change-in-production";

// Валидация входных данных
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  
  next();
};

const validateRegister = (req, res, next) => {
  const { firstName, lastName, birthDate, email, username, password } = req.body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !username?.trim() || !password?.trim()) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Проверка возраста (14+ лет)
  const birthDateObj = new Date(birthDate);
  const minAgeDate = new Date();
  minAgeDate.setFullYear(minAgeDate.getFullYear() - 14);
  
  if (birthDateObj > minAgeDate) {
    return res.status(400).json({ error: "You must be at least 14 years old" });
  }

  next();
};

// Login with JWT
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 LOGIN ATTEMPT for user:', username);

    const user = await findUser(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log('🔐 AUTH SUCCESS for user:', user.username);

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token: token
    });

  } catch (error) {
    console.error('🔐 LOGIN ERROR:', error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Register
router.post("/register", validateRegister, async (req, res) => {
  try {
    const { firstName, lastName, birthDate, email, username, password } = req.body;

    console.log('🔐 REGISTER ATTEMPT for user:', username);

    const existingUser = await findUser(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      email: email.trim(),
      username: username.trim(),
      password: hashedPassword,
      role: "user",
      status: "active",
      friends: [],
      photos: [],
      news: []
    });

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: "User created successfully",
      user: userWithoutPassword,
      token: token
    });

  } catch (error) {
    console.error('🔐 REGISTRATION ERROR:', error);
    res.status(500).json({ error: "Error creating user" });
  }
});

// Middleware для проверки JWT
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log('🔐 INVALID TOKEN:', err.message);
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    
    try {
      const user = await findUserById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
      
      console.log('🔐 AUTH SUCCESS for user:', user.username);
      next();
    } catch (error) {
      console.error('🔐 AUTH MIDDLEWARE ERROR:', error);
      res.status(500).json({ error: "Server error during authentication" });
    }
  });
}

// Check auth status with JWT
router.get("/status", authenticateToken, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

// Logout
router.post("/logout", authenticateToken, (req, res) => {
  res.json({ message: "Logout successful" });
});

export default router;