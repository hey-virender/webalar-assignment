import Task from "../models/Task.js";
import User from "../models/User.js";
import { TaskLogService } from "./taskLogService.js";

export class TaskService {
  static async createTask(taskData, userId) {
    try {
      const task = await Task.create({ ...taskData, createdBy: userId });
      await TaskLogService.logTaskCreated(task, userId);
      return task;
    } catch (error) {
      throw new Error("Failed to create task");
    }
  }

  static async updateTask(taskId, updates, userId) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error("Task not found");
      }
      await Task.findByIdAndUpdate(taskId, updates, { new: true });
      await TaskLogService.logTaskUpdated(task, updates, userId);
      return task;
    } catch (error) {
      throw new Error("Failed to update task");
    }
  }

  static async deleteTask(taskId, userId) {
    try {
      const task = await Task.findByIdAndDelete(taskId);
      await TaskLogService.logTaskDeleted(task, userId);
      return task;
    } catch (error) {
      throw new Error("Failed to delete task");
    }
  }

  static async updateTaskStatus(taskId, newStatus, userId) {
    const oldTask = await Task.findById(taskId);
    if (!oldTask) {
      console.error("Task not found:", taskId);
      return;
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
    return task;
  }

  static async smartAssign(taskId, userId) {
    const task = await Task.findById(taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    const users = await User.find();

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

    return updatedTask;
  }
}
