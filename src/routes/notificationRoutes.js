import express from "express";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// GET
router.get("/", authMiddleware, getNotifications);

// MARK ONE READ
router.put("/read/:id", authMiddleware, markNotificationAsRead);

// MARK ALL READ
router.put("/read-all", authMiddleware, markAllNotificationsAsRead);

// DELETE
router.delete("/:id", authMiddleware, deleteNotification);

export default router;
