import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  createTask,
  getTaskById,
  getTasks,
  smartAssign,

} from "../controllers/task.controller.js";

const router = express.Router();

// Apply JWT middleware to all task routes
router.use(authenticateToken);

// Task CRUD operations 
router.post("/", createTask);

//These are actually used in the frontend
router.get("/", getTasks);
router.get("/:id", getTaskById);


// Task assignment operations
router.patch("/:id/smart-assign", smartAssign);

export default router;
