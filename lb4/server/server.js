import express from "express";
import http from "http";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { router as authRoutes } from "./routes/auth.route.js";
import { router as usersRoutes } from "./routes/users.js";
import { router as newsRoutes } from "./routes/news.js";
import { router as friendsRoutes } from "./routes/friends.js";
import { router as messagesRoutes } from "./routes/messages.js";
import { setupWebSocket } from "./socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Конфигурация CORS
const allowedOrigins = ['http://127.0.0.1:4200', 'http://localhost:4200'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-CSRF-Token");
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование только в development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log("=== REQUEST ===");
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("Origin:", req.headers.origin);
    console.log("Authorization:", req.headers.authorization ? "Present" : "None");
    next();
  });
}

// Routes
app.use("/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/messages", messagesRoutes);

// Static files
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Health check с проверкой БД
app.get("/api/health", async (req, res) => {
  try {
    // Можно добавить проверку подключения к БД если будет
    res.json({
      status: "OK",
      message: "JWT Auth Server is running",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      message: "Service unavailable"
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled Error:', error);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 JWT Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;