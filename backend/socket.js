import { Server } from "socket.io";
import { verifyToken } from "./utils/jwt.js";
import { TaskService } from "./services/taskService.js";

export function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://192.168.0.161:5173",
        process.env.FRONTEND_URL,
      ],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      // Get cookie string from headers
      const cookieString = socket.handshake.headers.cookie;

      if (!cookieString) {
        return next(new Error("No cookies found"));
      }

      // Parse cookies into an object
      const cookies = {};
      cookieString.split(";").forEach((cookie) => {
        const parts = cookie.trim().split("=");
        if (parts.length === 2) {
          cookies[parts[0]] = parts[1];
        }
      });

      // Extract token from cookies
      const token = cookies.token;

      if (!token) {
        return next(new Error("Authentication token not found"));
      }

      // Verify the JWT token
      const user = verifyToken(token);
      if (!user) {
        return next(new Error("Invalid or expired token"));
      }

      socket.user = user; // Attach user to socket
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user; // Get user
    console.log("User connected:", user.id);

    // Join user to their own room for private notifications
    socket.join(`user-${user.id}`);

    // Handle editing session start
    socket.on("startEditingTask", async (data) => {
      const { taskId } = data;

      const result = await TaskService.startEditingSession(taskId, user.id);

      if (result.success) {
        // Join task-specific room for real-time collaboration
        socket.join(`task-${taskId}`);

        // Notify other users in the task room about new editor
        socket.to(`task-${taskId}`).emit("userStartedEditing", {
          taskId,
          userId: user.id,
          userName: user.name,
          activeEditors: result.data.activeEditors,
          currentEditors: result.data.currentEditors,
        });

        // Confirm to the user
        socket.emit("editingSessionStarted", {
          taskId,
          success: true,
          activeEditors: result.data.activeEditors,
        });
      } else {
        socket.emit("editingSessionStarted", {
          taskId,
          success: false,
          error: result.error,
        });
      }
    });

    // Handle editing session end
    socket.on("endEditingTask", async (data) => {
      const { taskId } = data;

      const result = await TaskService.endEditingSession(taskId, user.id);

      if (result.success) {
        // Leave task-specific room
        socket.leave(`task-${taskId}`);

        // Notify other users in the task room
        socket.to(`task-${taskId}`).emit("userStoppedEditing", {
          taskId,
          userId: user.id,
          userName: user.name,
          activeEditors: result.data.activeEditors,
          currentEditors: result.data.currentEditors,
        });

        socket.emit("editingSessionEnded", {
          taskId,
          success: true,
        });
      }
    });

    // Enhanced update with conflict detection
    socket.on("updateTaskWithConflictCheck", async (data) => {
      const { taskId, updates, clientVersion } = data;

      const result = await TaskService.updateTaskWithConflictDetection(
        taskId,
        updates,
        user.id,
        clientVersion,
      );

      if (result.success) {
        // Update successful - broadcast to all users
        io.emit("taskUpdated", {
          task: result.data,
          success: true,
          error: null,
        });
      } else if (result.type === "CONFLICT") {
        // Conflict detected - send conflict data only to the user who initiated the update
        socket.emit("conflictDetected", {
          taskId,
          conflicts: result.conflicts,
          currentTask: result.currentTask,
          proposedChanges: result.proposedChanges,
          currentVersion: result.currentVersion,
        });
      } else {
        // Regular error
        socket.emit("taskUpdated", {
          task: null,
          success: false,
          error: result.error,
        });
      }
    });

    // Handle conflict resolution
    socket.on("resolveConflict", async (data) => {
      const { taskId, resolution } = data;

      const result = await TaskService.resolveConflict(
        taskId,
        resolution,
        user.id,
      );

      if (result.success) {
        // Broadcast resolved task to all users
        io.emit("conflictResolved", {
          task: result.data,
          success: true,
          resolvedBy: user.id,
          resolutionType: resolution.type,
        });

        // Also emit regular taskUpdated for clients that don't handle conflicts yet
        io.emit("taskUpdated", {
          task: result.data,
          success: true,
          error: null,
        });
      } else {
        socket.emit("conflictResolution", {
          success: false,
          error: result.error,
        });
      }
    });

    // Clean up stale editing sessions periodically
    socket.on("heartbeat", async (data) => {
      if (data.editingTaskId) {
        await TaskService.cleanupStaleEditingSessions(data.editingTaskId);

        // Update last activity for this user's session
        await TaskService.startEditingSession(data.editingTaskId, user.id);
      }
    });

    socket.on("createTask", async (data) => {
      const result = await TaskService.createTask(data, user.id);

      if (result.success) {
        io.emit("taskCreated", {
          task: result.data,
          success: true,
          error: null,
        });
      } else {
        socket.emit("taskCreated", {
          task: null,
          success: false,
          error: result.error,
        });
      }
    });

    socket.on("updateTask", async (data) => {
      const result = await TaskService.updateTask(
        data.taskId,
        data.updates,
        user.id,
      );

      if (result.success) {
        io.emit("taskUpdated", {
          task: result.data,
          success: true,
          error: null,
        });
      } else {
        socket.emit("taskUpdated", {
          task: null,
          success: false,
          error: result.error,
        });
      }
    });

    socket.on("deleteTask", async (data) => {
      const result = await TaskService.deleteTask(data.taskId, user.id);

      if (result.success) {
        io.emit("taskDeleted", {
          task: result.data,
          success: true,
          error: null,
        });
      } else {
        socket.emit("taskDeleted", {
          task: null,
          success: false,
          error: result.error,
        });
      }
    });

    socket.on("updateTaskStatus", async (data) => {
      const result = await TaskService.updateTaskStatus(
        data.taskId,
        data.newStatus,
        user.id,
      );

      if (result.success) {
        io.emit("taskStatusUpdated", {
          task: result.data,
          success: true,
          error: null,
        });
      } else {
        socket.emit("taskStatusUpdated", {
          task: null,
          success: false,
          error: result.error,
        });
      }
    });

    socket.on("smartAssign", async (data) => {
      const result = await TaskService.smartAssign(data.taskId, user.id);

      if (result.success) {
        io.emit("taskAssigned", {
          task: result.data,
          success: true,
          error: null,
        });
      } else {
        socket.emit("taskAssigned", {
          task: null,
          success: false,
          error: result.error,
        });
      }
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", user.id);

      try {
        socket.leaveAll();
      } catch (error) {
        console.error(
          "Error cleaning up editing sessions on disconnect:",
          error,
        );
      }
    });
  });
}
