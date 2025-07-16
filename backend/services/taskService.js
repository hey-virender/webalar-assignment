import Task from "../models/Task.js";
import User from "../models/User.js";
import { TaskLogService } from "./taskLogService.js";

export class TaskService {
  // Conflict detection and analysis
  static analyzeConflicts(currentTask, proposedUpdates) {
    const conflicts = {};

    // Check each field for conflicts
    const fieldsToCheck = [
      "title",
      "description",
      "assignedTo",
      "status",
      "priority",
    ];

    fieldsToCheck.forEach((field) => {
      if (proposedUpdates.hasOwnProperty(field)) {
        const currentValue = currentTask[field];
        const proposedValue = proposedUpdates[field];

        // Convert ObjectIds to strings for comparison
        const currentStr = currentValue ? currentValue.toString() : null;
        const proposedStr = proposedValue ? proposedValue.toString() : null;

        if (currentStr !== proposedStr) {
          conflicts[field] = {
            current: currentValue,
            proposed: proposedValue,
            hasConflict: true,
          };
        }
      }
    });

    return conflicts;
  }

  // Start editing session
  static async startEditingSession(taskId, userId) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        return { success: false, error: "Task not found" };
      }

      // Check if user already has an active session
      const existingSession = task.editingSessions.find(
        (session) => session.userId.toString() === userId.toString(),
      );

      if (!existingSession) {
        // Add new editing session
        task.editingSessions.push({
          userId,
          startedAt: new Date(),
          lastActivity: new Date(),
        });
        await task.save();
      } else {
        // Update last activity
        existingSession.lastActivity = new Date();
        await task.save();
      }

      return {
        success: true,
        data: {
          activeEditors: task.editingSessions.length,
          currentEditors: task.editingSessions.map((session) => session.userId),
        },
      };
    } catch (error) {
      console.log("Error starting editing session:", error);
      return { success: false, error: error.message };
    }
  }

  // End editing session
  static async endEditingSession(taskId, userId) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        return { success: false, error: "Task not found" };
      }

      // Remove user's editing session
      task.editingSessions = task.editingSessions.filter(
        (session) => session.userId.toString() !== userId.toString(),
      );

      await task.save();

      return {
        success: true,
        data: {
          activeEditors: task.editingSessions.length,
          currentEditors: task.editingSessions.map((session) => session.userId),
        },
      };
    } catch (error) {
      console.log("Error ending editing session:", error);
      return { success: false, error: error.message };
    }
  }

  // Clean up stale editing sessions (older than 5 minutes)
  static async cleanupStaleEditingSessions(taskId) {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const task = await Task.findById(taskId);
      if (!task) return;

      const originalCount = task.editingSessions.length;
      task.editingSessions = task.editingSessions.filter(
        (session) => session.lastActivity > fiveMinutesAgo,
      );

      if (task.editingSessions.length !== originalCount) {
        await task.save();
      }

      return task.editingSessions;
    } catch (error) {
      console.log("Error cleaning up stale sessions:", error);
      return [];
    }
  }

  // Enhanced update method with conflict detection
  static async updateTaskWithConflictDetection(
    taskId,
    updates,
    userId,
    clientVersion,
  ) {
    try {
      const currentTask = await Task.findById(taskId)
        .populate("assignedTo", "name")
        .populate("createdBy", "name")
        .populate("lastUpdatedBy", "name");

      if (!currentTask) {
        return {
          success: false,
          error: "Task not found",
        };
      }

      // Check for version conflict
      if (clientVersion && currentTask.version !== clientVersion) {
        // Conflict detected - analyze differences
        const conflicts = this.analyzeConflicts(currentTask, updates);

        return {
          success: false,
          type: "CONFLICT",
          conflicts,
          currentTask: currentTask.toObject(),
          proposedChanges: updates,
          currentVersion: currentTask.version,
        };
      }

      // Proceed with regular update logic (existing validation)
      const taskTitle = updates.title?.trim().toLowerCase();
      if (
        taskTitle &&
        (taskTitle == "to do" ||
          taskTitle == "in progress" ||
          taskTitle == "completed" ||
          taskTitle == "todo" ||
          taskTitle == "inprogress")
      ) {
        return {
          success: false,
          error:
            "Task title cannot be 'to do', 'in progress', 'done' or 'todo'",
        };
      }

      if (updates.title) {
        const sameTitleTask = await Task.findOne({
          title: updates.title,
          _id: { $ne: taskId }, // Exclude current task
        });
        if (sameTitleTask) {
          return {
            success: false,
            error: "Task with same title already exists",
          };
        }
      }

      // Increment version and update
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          ...updates,
          lastUpdatedBy: userId,
          version: currentTask.version + 1,
        },
        { new: true },
      )
        .populate("assignedTo", "name")
        .populate("createdBy", "name")
        .populate("lastUpdatedBy", "name");

      await TaskLogService.logTaskUpdated(currentTask, updates, userId);

      return {
        success: true,
        data: updatedTask,
        error: null,
      };
    } catch (error) {
      console.log("Error updating task with conflict detection:", error);
      return {
        success: false,
        error: error.message || "Failed to update task",
      };
    }
  }

  // Resolve conflict by applying user's choice
  static async resolveConflict(taskId, resolution, userId) {
    try {
      const currentTask = await Task.findById(taskId);
      if (!currentTask) {
        return { success: false, error: "Task not found" };
      }

      let finalUpdates = {};

      if (resolution.type === "overwrite") {
        // User chose to overwrite with their changes
        finalUpdates = resolution.updates;
      } else if (resolution.type === "merge") {
        // User chose field-level merge
        finalUpdates = resolution.mergedFields;
      } else if (resolution.type === "discard") {
        // User chose to discard their changes
        return {
          success: true,
          data: currentTask,
          message: "Changes discarded",
        };
      }

      // Apply the resolved updates
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          ...finalUpdates,
          lastUpdatedBy: userId,
          version: currentTask.version + 1,
        },
        { new: true },
      )
        .populate("assignedTo", "name")
        .populate("createdBy", "name")
        .populate("lastUpdatedBy", "name");

      await TaskLogService.logTaskUpdated(currentTask, finalUpdates, userId);

      return {
        success: true,
        data: updatedTask,
        error: null,
      };
    } catch (error) {
      console.log("Error resolving conflict:", error);
      return {
        success: false,
        error: error.message || "Failed to resolve conflict",
      };
    }
  }

  static async createTask(taskData, userId) {
    try {
      if (
        taskData.title.trim().toLowerCase() == "to do" ||
        taskData.title.trim().toLowerCase() == "in progress" ||
        taskData.title.trim().toLowerCase() == "completed" ||
        taskData.title.trim().toLowerCase() == "todo" ||
        taskData.title.trim().toLowerCase() == "inprogress"
      ) {
        return {
          success: false,
          data: null,
          error:
            "Task title cannot be 'to do', 'in progress', 'done' or 'todo'",
        };
      }

      const sameTitleTask = await Task.findOne({ title: taskData.title });
      if (sameTitleTask) {
        return {
          success: false,
          data: null,
          error: "Task with same title already exists",
        };
      }

      const task = await Task.create({ ...taskData, createdBy: userId });
      await TaskLogService.logTaskCreated(task, userId);

      return {
        success: true,
        data: task,
        error: null,
      };
    } catch (error) {
      console.log("Error creating task:", error);
      return {
        success: false,
        data: null,
        error: error.message || "Failed to create task",
      };
    }
  }

  static async updateTask(taskId, updates, userId) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        return {
          success: false,
          data: null,
          error: "Task not found",
        };
      }
      const taskTitle = updates.title.trim().toLowerCase();
      if (
        taskTitle == "to do" ||
        taskTitle == "in progress" ||
        taskTitle == "completed" ||
        taskTitle == "todo" ||
        taskTitle == "inprogress"
      ) {
        return {
          success: false,
          data: null,
          error:
            "Task title cannot be 'to do', 'in progress', 'done' or 'todo'",
        };
      }
      const sameTitleTask = await Task.findOne({ title: updates.title });
      if (sameTitleTask) {
        return {
          success: false,
          data: null,
          error: "Task with same title already exists",
        };
      }
      const updatedTask = await Task.findByIdAndUpdate(taskId, updates, {
        new: true,
      });
      await TaskLogService.logTaskUpdated(task, updates, userId);

      return {
        success: true,
        data: updatedTask,
        error: null,
      };
    } catch (error) {
      console.log("Error updating task:", error);
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update task",
      };
    }
  }

  static async deleteTask(taskId, userId) {
    try {
      const task = await Task.findByIdAndDelete(taskId);
      if (!task) {
        return {
          success: false,
          data: null,
          error: "Task not found",
        };
      }

      await TaskLogService.logTaskDeleted(task, userId);

      return {
        success: true,
        data: task,
        error: null,
      };
    } catch (error) {
      console.log("Error deleting task:", error);
      return {
        success: false,
        data: null,
        error: error.message || "Failed to delete task",
      };
    }
  }

  static async updateTaskStatus(taskId, newStatus, userId) {
    try {
      const oldTask = await Task.findById(taskId);
      if (!oldTask) {
        return {
          success: false,
          data: null,
          error: "Task not found",
        };
      }

      const oldStatus = oldTask.status;

      // Update the task
      const task = await Task.findByIdAndUpdate(
        taskId,
        {
          status: newStatus,
          lastUpdatedBy: userId,
        },
        { new: true }, // Return the updated document
      )
        .populate("assignedTo", "name")
        .populate("createdBy", "name")
        .populate("lastUpdatedBy", "name");

      await TaskLogService.logStatusChange(task, oldStatus, newStatus, userId);

      return {
        success: true,
        data: task,
        error: null,
      };
    } catch (error) {
      console.log("Error updating task status:", error);
      return {
        success: false,
        data: null,
        error: error.message || "Failed to update task status",
      };
    }
  }

  static async smartAssign(taskId, userId) {
    try {
      const task = await Task.findById(taskId);

      if (!task) {
        return {
          success: false,
          data: null,
          error: "Task not found",
        };
      }

      const users = await User.find();

      if (users.length === 0) {
        return {
          success: false,
          data: null,
          error: "No users available for assignment",
        };
      }

      const userTaskCounts = await Promise.all(
        users.map(async (user) => {
          const count = await Task.countDocuments({
            assignedTo: user._id,
            status: { $in: ["inprogress", "todo"] },
          });
          return { user, count };
        }),
      );

      const minCount = Math.min(...userTaskCounts.map((u) => u.count));
      const candidates = userTaskCounts.filter((u) => u.count === minCount);

      const selectedUser = candidates[0].user;

      // Store old assignee for logging
      const oldAssignee = task.assignedTo ? task.assignedTo.name : null;

      task.assignedTo = selectedUser._id;
      task.lastUpdatedBy = userId;
      await task.save();

      const updatedTask = await Task.findById(taskId)
        .populate("assignedTo", "name")
        .populate("createdBy", "name")
        .populate("lastUpdatedBy", "name");

      // Log smart assignment
      await TaskLogService.logTaskAssigned(
        task,
        oldAssignee,
        selectedUser.name,
        userId,
        true, // isSmartAssign = true
      );

      return {
        success: true,
        data: updatedTask,
        error: null,
      };
    } catch (error) {
      console.log("Error smart assigning task:", error);
      return {
        success: false,
        data: null,
        error: error.message || "Failed to smart assign task",
      };
    }
  }
}
