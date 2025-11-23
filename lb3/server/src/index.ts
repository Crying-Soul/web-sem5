import express from "express";

import userRoutes from "./routes/userRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const app = express();
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);

app.use(express.static("../client/dist"));

app.get("/", (_req, res) => {
  res.sendFile("index.html", { root: "../client/dist" });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
