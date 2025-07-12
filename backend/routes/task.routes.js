import express from "express";
import { createTask, getTaskById, getTasks } from "../controllers/task.controller.js";


const router = express.Router();

router.post("/",createTask);
router.get("/",getTasks);
router.get("/:id",getTaskById);

export default router;