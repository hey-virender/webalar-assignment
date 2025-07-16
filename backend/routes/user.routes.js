import express from "express";
import { getUsers } from "../controllers/user.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getUsers);

export default router;
