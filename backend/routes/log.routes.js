import express from "express";
import { getLogs } from "../controllers/log.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getLogs);

export default router;