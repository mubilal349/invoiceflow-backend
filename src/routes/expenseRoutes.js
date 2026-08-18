import express from "express";

import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getFinancialSummary,
} from "../controllers/expenseController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// GET - Admin + Users
router.get("/", authMiddleware, getExpenses);

router.get("/summary", authMiddleware, getFinancialSummary);

router.get("/:id", authMiddleware, getExpense);

// POST - Admin only
router.post("/", authMiddleware, adminMiddleware, createExpense);

// PUT - Admin only
router.put("/:id", authMiddleware, adminMiddleware, updateExpense);

// DELETE - Admin only
router.delete("/:id", authMiddleware, adminMiddleware, deleteExpense);

export default router;
