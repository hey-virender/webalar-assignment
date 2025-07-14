import Task from "../models/Task.js";
import User from "../models/User.js";
import { TaskLogService } from "../services/taskLogService.js";

export const createTask = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.session.user.id;
    const { title, description, assignedTo } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({ message: "Assigned user not found" });
      }
    }
    const task = await Task.create({
      title,
      description,
      assignedTo,
      createdBy: userId,
    });

    // Log task creation
    await TaskLogService.logTaskCreated(task, userId);

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTasks = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const tasks = await Task.find()
      .populate({
        path: "assignedTo",
        select: "name",
      })
      .populate({
        path: "createdBy",
        select: "name",
      })
      .populate({
        path: "lastUpdatedBy",
        select: "name",
      });
    res.status(200).json({ tasks });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTaskById = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const taskId = req.params.id;
    const task = await Task.findById(taskId).populate("assignedTo", "name");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ task });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const assignTask = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const taskId = req.params.id;
    const { assignedTo } = req.body;

    // Allow null/undefined for unassigning
    if (assignedTo && assignedTo !== null) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({ message: "Assigned user not found" });
      }
    }

    const task = await Task.findById(taskId).populate("assignedTo", "name");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.status === "completed") {
      return res.status(400).json({ message: "Task is already completed" });
    }

    // Store old assignee for logging
    const oldAssignee = task.assignedTo ? task.assignedTo.name : null;
    let newAssigneeName = null;

    if (assignedTo && assignedTo !== null) {
      const newAssigneeUser = await User.findById(assignedTo);
      newAssigneeName = newAssigneeUser.name;
    }

    task.assignedTo = assignedTo || null;
    task.lastUpdatedBy = req.session.user.id;
    await task.save();

    // Log task assignment/unassignment
    await TaskLogService.logTaskAssigned(
      task,
      oldAssignee,
      newAssigneeName || "Unassigned",
      req.session.user.id,
    );

    const message = assignedTo
      ? "Task assigned successfully"
      : "Task unassigned successfully";
    res.status(200).json({ message, task });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const smartAssign = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const taskId = req.params.id;
    const task = await Task.findById(taskId).populate("assignedTo", "name");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
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
    task.lastUpdatedBy = req.session.user.id;
    await task.save();

    // Log smart assignment
    await TaskLogService.logTaskAssigned(
      task,
      oldAssignee,
      selectedUser.name,
      req.session.user.id,
      true, // isSmartAssign = true
    );

    res.status(200).json({
      message: "Task smart-assigned successfully",
      task,
      assignedTo: selectedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const taskId = req.params.id;
    const { title, description } = req.body;

    if (!title && !description) {
      return res.status(400).json({
        message: "At least one field (title or description) is required",
      });
    }

    const oldTask = await Task.findById(taskId);
    if (!oldTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Track changes for logging
    const changes = { old: {}, new: {} };
    const updateFields = {};

    if (title && title !== oldTask.title) {
      changes.old.title = oldTask.title;
      changes.new.title = title;
      updateFields.title = title;
    }

    if (description && description !== oldTask.description) {
      changes.old.description = oldTask.description;
      changes.new.description = description;
      updateFields.description = description;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No changes detected" });
    }

    updateFields.lastUpdatedBy = req.session.user.id;

    const task = await Task.findByIdAndUpdate(taskId, updateFields, {
      new: true,
    })
      .populate("assignedTo", "name")
      .populate("createdBy", "name")
      .populate("lastUpdatedBy", "name");

    // Log task update
    await TaskLogService.logTaskUpdated(task, changes, req.session.user.id);

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const taskId = req.params.id;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Log task deletion before actually deleting
    await TaskLogService.logTaskDeleted(task, req.session.user.id);

    await Task.findByIdAndDelete(taskId);

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTaskHistory = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const taskId = req.params.id;
    const limit = parseInt(req.query.limit) || 50;

    const history = await TaskLogService.getTaskHistory(taskId, limit);

    res.status(200).json({ history });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const taskId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Validate status
    const validStatuses = ["todo", "inProgress", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const oldStatus = task.status;

    task.status = status;
    task.lastUpdatedBy = req.session.user.id;
    await task.save();

    // Log status change
    await TaskLogService.logStatusChange(
      task,
      oldStatus,
      status,
      req.session.user.id,
    );

    res.status(200).json({ message: "Status updated successfully", task });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserActivity = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.params.userId || req.session.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const activity = await TaskLogService.getUserActivity(userId, limit);

    res.status(200).json({ activity });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
