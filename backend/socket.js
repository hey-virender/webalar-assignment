import { Server } from "socket.io";
import sharedSession from "express-socket.io-session";
import { TaskService } from "./services/taskService.js";

export function setupSocket(server, sessionMiddleware) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(
    sharedSession(sessionMiddleware, {
      autoSave: true,
    }),
  );

  io.on("connection", (socket) => {
    const user = socket.handshake.session?.user;
    console.log(socket.handshake.session);

    if (!user) {
      console.log("Unauthorized socket attempt");
      socket.emit("unauthorized");
      return socket.disconnect();
    }

    console.log("User connected:", user.id);

    socket.on("createTask", async (data) => {
      try {
        const task = await TaskService.createTask(data, user.id);
        io.emit("taskCreated", task);
      } catch (error) {
        console.error("Error creating task:", error);
      }
    });

    socket.on("updateTask", async (data) => {
      try {
        const task = await TaskService.updateTask(
          data.taskId,
          data.updates,
          user.id,
        );
        io.emit("taskUpdated", task);
      } catch (error) {
        console.error("Error updating task:", error);
      }
    });

    socket.on("deleteTask", async (data) => {
      try {
        const task = await TaskService.deleteTask(data.taskId, user.id);
        io.emit("taskDeleted", task);
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    });

    socket.on("updateTaskStatus", async (data) => {
      try {
        // Get the task with old status first
        const task = await TaskService.updateTaskStatus(
          data.taskId,
          data.newStatus,
          user.id,
        );

        if (task) {
          io.emit("taskStatusUpdated", task);
        }
      } catch (error) {
        console.error("Error updating task status:", error);
      }
    });

    socket.on("smartAssign", async (data) => {
      try {
        const task = await TaskService.smartAssign(data.taskId, user.id);
        io.emit("taskAssigned", task);
      } catch (error) {
        console.error("Error smart assigning task:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", user.id);
    });
  });
}
