import express from "express";

import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerInvoices,
} from "../controllers/customerController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// =========================================
// VIEW CUSTOMERS
// =========================================

router.get("/", authMiddleware, getCustomers);

router.get("/:id", authMiddleware, getCustomer);

router.get("/:id/invoices", authMiddleware, getCustomerInvoices);

// =========================================
// ADMIN CUSTOMER MANAGEMENT
// =========================================

router.post("/", authMiddleware, adminMiddleware, createCustomer);

router.put("/:id", authMiddleware, adminMiddleware, updateCustomer);

router.delete("/:id", authMiddleware, adminMiddleware, deleteCustomer);

export default router;
