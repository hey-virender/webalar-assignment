import Task from "../models/Task.js";
import User from "../models/User.js";
import { TaskLogService } from "../services/taskLogService.js";
import { TaskService } from "../services/taskService.js";

export const createTask = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const { title, description, assignedTo, priority } = req.body;
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
    const task = await TaskService.createTask(
      { title, description, assignedTo, priority },
      userId,
    );

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTasks = async (req, res) => {
  try {
    if (!req.user) {
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
    console.log("getTaskById");
    console.log(req.user);
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const taskId = req.params.id;
    console.log(taskId);
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


export const smartAssign = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const taskId = req.params.id;
    const task = await TaskService.smartAssign(taskId, req.user.id);

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
