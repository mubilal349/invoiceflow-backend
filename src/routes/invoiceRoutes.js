import express from "express";

import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePDF,
  getCustomersFromInvoices,
} from "../controllers/invoiceController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

/*
=========================================
USER + ADMIN

VIEW CUSTOMERS FROM INVOICES
=========================================
*/

router.get("/customers", authMiddleware, getCustomersFromInvoices);

/*
=========================================
USER + ADMIN

VIEW ALL INVOICES
=========================================
*/

router.get("/", authMiddleware, getInvoices);

/*
=========================================
USER + ADMIN

DOWNLOAD INVOICE PDF
=========================================
*/

router.get("/:id/pdf", authMiddleware, downloadInvoicePDF);

/*
=========================================
USER + ADMIN

VIEW SINGLE INVOICE
=========================================
*/

router.get("/:id", authMiddleware, getInvoiceById);

/*
=========================================
ADMIN ONLY

CREATE
=========================================
*/

router.post("/", authMiddleware, adminMiddleware, createInvoice);

/*
=========================================
ADMIN ONLY

UPDATE
=========================================
*/

router.put("/:id", authMiddleware, adminMiddleware, updateInvoice);

/*
=========================================
ADMIN ONLY

DELETE
=========================================
*/

router.delete("/:id", authMiddleware, adminMiddleware, deleteInvoice);

export default router;
