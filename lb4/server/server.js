// server.js - исправленная версия
import express from "express";
import session from "express-session";
import https from "https";
import fs from "fs";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import memorystore from "memorystore";
import { ensureAuthenticated, passport } from "./middleware/auth.js";
import { router as authRoutes } from "./routes/auth.route.js";
import { router as usersRoutes } from "./routes/users.js";
import { router as newsRoutes } from "./routes/news.js";
import { router as friendsRoutes } from "./routes/friends.js";
import { router as messagesRoutes } from "./routes/messages.js";
import { setupWebSocket } from "./socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ----- Read SSL cert/key (from ./ssl folder) -----
const sslDir = path.join(__dirname, "ssl");
const sslOptions = {
  key: fs.readFileSync(path.join(sslDir, "key.pem")),
  cert: fs.readFileSync(path.join(sslDir, "cert.pem"))
};

app.set("trust proxy", 1);

// ----- CORS: исправленная конфигурация -----
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://localhost:4200",
      "https://127.0.0.1:4200",
      "https://localhost:3000",
      "https://127.0.0.1:3000",
      "http://localhost:4200",
      "http://127.0.0.1:4200"
    ];

    // Разрешить запросы без origin (например, из мобильных приложений)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn("CORS blocked for origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cookie",
    "Set-Cookie",
    "X-CSRF-Token"
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Cookie parser — ДО сессии
app.use(cookieParser());

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ----- Session configuration (исправленная) -----
const MemoryStore = memorystore(session);
const sessionStore = new MemoryStore({ 
  checkPeriod: 86400000,
  // Убираем устаревшие сессии каждые 24 часа
});

const isProd = process.env.NODE_ENV === "production";

app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "social-network-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: true,        // true для HTTPS
      httpOnly: true,
      sameSite: "none",    // для кросс-доменных запросов
      maxAge: 24 * 60 * 60 * 1000, // 24 часа
      domain: "localhost"  // добавляем domain для локальной разработки
    },
    // Предотвращаем проблемы с параллельными запросами
    rolling: true
  })
);

// Passport middleware ДО debug middleware
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware (улучшенная версия)
app.use((req, res, next) => {
  console.log("=== REQUEST DEBUG ===");
  console.log("Origin:", req.headers.origin);
  console.log("Method:", req.method);
  console.log("Path:", req.path);
  console.log("Cookies:", req.cookies);
  console.log("Session ID:", req.sessionID);
  console.log("Session user:", req.session?.passport?.user);
  console.log("isAuthenticated:", req.isAuthenticated ? req.isAuthenticated() : "N/A");
  console.log("User:", req.user ? `${req.user.username} (id: ${req.user.id})` : "No user");
  console.log("=====================");
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/messages", messagesRoutes);

// Static files
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Social Network API Server (HTTPS) is running",
    timestamp: new Date().toISOString(),
    session: !!req.session,
    authenticated: req.isAuthenticated ? req.isAuthenticated() : false
  });
});

// Create HTTPS server
const PORT = process.env.PORT || 3000;
const httpsServer = https.createServer(sslOptions, app);

// WebSocket setup
const io = setupWebSocket(httpsServer);
app.set("io", io);

httpsServer.listen(PORT, () => {
  console.log(`🚀 HTTPS Server running on https://localhost:${PORT}`);
});

export default app;