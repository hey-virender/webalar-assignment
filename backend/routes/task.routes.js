import express from "express";
import {
  createTask,
  getTaskById,
  getTasks,
  updateTask,
  deleteTask,
  assignTask,
  smartAssign,
  getTaskHistory,
  getUserActivity,
} from "../controllers/task.controller.js";

const router = express.Router();

// Basic CRUD operations
router.post("/", createTask);
router.get("/", getTasks);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

// Task assignment operations
router.patch("/:id/assign", assignTask);
router.patch("/:id/smart-assign", smartAssign);

// Logging and history operations
router.get("/:id/history", getTaskHistory);
router.get("/activity/user", getUserActivity); // Current user activity
router.get("/activity/user/:userId", getUserActivity); // Specific user activity

export default router;
