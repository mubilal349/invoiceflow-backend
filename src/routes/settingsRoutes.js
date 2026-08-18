import express from "express";

import {
  getSettings,
  updateSettings,
  changePassword,
} from "../controllers/settingsController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get settings
router.get("/", authMiddleware, getSettings);

// Update settings
router.put("/", authMiddleware, updateSettings);

// Change password
router.put("/password", authMiddleware, changePassword);

export default router;
