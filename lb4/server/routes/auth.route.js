// auth.route.js - исправленная версия
import express from "express";
import bcrypt from "bcryptjs";
import {
  passport,
  ensureAuthenticated,
  ensureNotAuthenticated,
  createUser,
  findUser,
} from "../middleware/auth.js";

export const router = express.Router();

// Login (исправленный)
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error('Auth error:', err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (!user) {
      return res.status(401).json({
        error: "Authentication failed",
        details: info?.message || "Invalid credentials",
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: "Login failed" });
      }

      console.log("=== AFTER LOGIN ===");
      console.log("isAuthenticated:", req.isAuthenticated());
      console.log("User:", req.user);
      console.log("Session ID:", req.sessionID);
      console.log("==================");

      // Возвращаем ответ сразу после успешного логина
      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      });
    });
  })(req, res, next);
});

// Register (без изменений)
router.post("/register", ensureNotAuthenticated, async (req, res) => {
  try {
    const { firstName, lastName, birthDate, email, username, password } =
      req.body;

    if (
      !firstName ||
      !lastName ||
      !birthDate ||
      !email ||
      !username ||
      !password
    ) {
      return res
        .status(400)
        .json({ error: "Все поля обязательны для заполнения" });
    }

    const existingUser = await findUser(username);
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Пользователь с таким именем уже существует" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({
      firstName,
      lastName,
      birthDate,
      email,
      username,
      password: hashedPassword,
      role: "user",
      status: "unconfirmed",
      friends: [],
      photos: [],
      news: [],
    });

    res.json({
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Error creating user: " + error.message });
  }
});

// Logout (исправленный)
router.post("/logout", ensureAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: "Error logging out" });
    }

    // Очищаем cookie
    res.clearCookie("connect.sid", {
      path: '/',
      domain: 'localhost'
    });

    // Уничтожаем сессию
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.json({ message: "Logout successful" });
    });
  });
});

// Check auth status (улучшенный)
router.get("/status", (req, res) => {
  console.log("=== AUTH STATUS CHECK ===");
  console.log("Session ID:", req.sessionID);
  console.log("isAuthenticated:", req.isAuthenticated());
  console.log("User:", req.user);
  
  if (req.isAuthenticated() && req.user) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
      },
    });
  } else {
    res.json({ 
      authenticated: false,
      details: "No active session"
    });
  }
});

// Получить ID пользователя из сессии
router.get("/user-id", ensureAuthenticated, (req, res) => {
  res.json({ userId: req.user.id });
});