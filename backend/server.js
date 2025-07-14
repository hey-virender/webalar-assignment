import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import express from "express";
import http from "http";
import { setupSocket } from "./socket.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import userRoutes from "./routes/user.routes.js";
import sessionMiddleware from "./middlewares/session.middleware.js";
import cors from "cors";
import logRoutes from "./routes/log.routes.js";

const app = express();
const server = http.createServer(app);
setupSocket(server, sessionMiddleware);
connectDB();
app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.0.161:5173/"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Credentials",
    ],
    exposedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Credentials",
    ],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/log", logRoutes);
server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
