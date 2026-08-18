import express from "express";
import { register, login } from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Protected dashboard route
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to your dashboard",
    user: req.user,
  });
});

export default router;
