import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import express from "express";
import http from "http";
import { setupSocket } from "./socket.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import sessionMiddleware from "./middlewares/session.middleware.js";

const app = express();
const server = http.createServer(app);
setupSocket(server, sessionMiddleware);
connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/task", taskRoutes);
server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
