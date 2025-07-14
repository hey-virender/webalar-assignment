import { Server } from "socket.io";
import sharedSession from "express-socket.io-session";
import Task from "./models/Task.js";
import { TaskLogService } from "./services/taskLogService.js";

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
      return socket.disconnect();
    }

    console.log("User connected:", user.id);

    // Handle events
    socket.on("send-note", (data) => {
      console.log(`User ${user.id} sent note:`, data);
      // broadcast or save to DB
    });

    socket.on("updateTaskStatus", async (data) => {
      console.log(data);
      try {
        // Get the task with old status first
        const oldTask = await Task.findById(data.taskId);
        if (!oldTask) {
          console.error("Task not found:", data.taskId);
          return;
        }

        const oldStatus = oldTask.status;

        // Update the task
        const task = await Task.findByIdAndUpdate(
          data.taskId,
          {
            status: data.newStatus,
            lastUpdatedBy: user.id,
          },
          { new: true }, // Return the updated document
        );

        if (task) {
          // Log the status change
          await TaskLogService.logStatusChange(
            task,
            oldStatus,
            data.newStatus,
            user.id,
          );

          io.emit("taskStatusUpdated", task);
        }
      } catch (error) {
        console.error("Error updating task status:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", user.id);
    });
  });
}
