import Expense from "../models/Expense.js";
import Invoice from "../models/Invoice.js";

// =====================================================
// GET ALL EXPENSES
// Admin + Users
// =====================================================

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate(
        "invoice",
        "invoiceNumber number customerName customerEmail total",
      )
      .populate("createdBy", "name email role")
      .sort({
        date: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      expenses,
    });
  } catch (error) {
    console.error("Get expenses error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load expenses",
    });
  }
};

// =====================================================
// DASHBOARD FINANCIAL SUMMARY
// =====================================================

export const getFinancialSummary = async (req, res) => {
  try {
    // =====================================
    // TOTAL REVENUE FROM INVOICES
    // =====================================

    const invoices = await Invoice.find();

    const revenue = invoices.reduce((total, invoice) => {
      return (
        total +
        Number(invoice.total || invoice.grandTotal || invoice.amount || 0)
      );
    }, 0);

    // =====================================
    // TOTAL EXPENSES
    // =====================================

    const expenses = await Expense.find();

    const totalExpenses = expenses.reduce((total, expense) => {
      return total + Number(expense.amount || 0);
    }, 0);

    // =====================================
    // PROFIT
    // =====================================

    const profit = revenue - totalExpenses;

    return res.status(200).json({
      success: true,

      financial: {
        revenue,
        expenses: totalExpenses,
        profit,
      },
    });
  } catch (error) {
    console.error("Financial summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load financial summary",
    });
  }
};

// =====================================================
// GET SINGLE EXPENSE
// =====================================================

export const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate(
        "invoice",
        "invoiceNumber number customerName customerEmail total",
      )
      .populate("createdBy", "name email role");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error("Get expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load expense",
    });
  }
};

// =====================================================
// CREATE NORMAL EXPENSE
// =====================================================

export const createExpense = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      category,
      date,
      paymentMethod,
      vendor,
      reference,
      notes,
      invoice,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Expense title is required",
      });
    }

    if (amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Expense amount must be greater than 0",
      });
    }

    // =====================================
    // OPTIONAL INVOICE VALIDATION
    // =====================================

    let invoiceId = null;

    if (invoice) {
      const existingInvoice = await Invoice.findById(invoice);

      if (!existingInvoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      invoiceId = existingInvoice._id;
    }

    const expense = await Expense.create({
      title: title.trim(),

      description: description?.trim() || "",

      amount: Number(amount),

      category: category || "Other",

      date: date ? new Date(date) : new Date(),

      paymentMethod: paymentMethod || "Cash",

      vendor: vendor?.trim() || "",

      reference: reference?.trim() || "",

      notes: notes?.trim() || "",

      invoice: invoiceId,

      createdBy: req.user._id,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate(
        "invoice",
        "invoiceNumber number customerName customerEmail total",
      )
      .populate("createdBy", "name email role");

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense: populatedExpense,
    });
  } catch (error) {
    console.error("Create expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create expense",
    });
  }
};

// =====================================================
// CREATE EXPENSE FROM INVOICE
// Admin only
// =====================================================

export const createExpenseFromInvoice = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      category,
      date,
      paymentMethod,
      vendor,
      reference,
      notes,
      invoiceId,
    } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID is required",
      });
    }

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Expense title is required",
      });
    }

    if (amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Expense amount must be greater than 0",
      });
    }

    const expense = await Expense.create({
      title: title.trim(),

      description: description?.trim() || "",

      amount: Number(amount),

      category: category || "Project Cost",

      date: date ? new Date(date) : new Date(),

      paymentMethod: paymentMethod || "Cash",

      vendor: vendor?.trim() || "",

      reference: reference?.trim() || "",

      notes: notes?.trim() || "",

      invoice: invoice._id,

      createdBy: req.user._id,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate(
        "invoice",
        "invoiceNumber number customerName customerEmail total",
      )
      .populate("createdBy", "name email role");

    return res.status(201).json({
      success: true,
      message: "Invoice expense created successfully",
      expense: populatedExpense,
    });
  } catch (error) {
    console.error("Create invoice expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create invoice expense",
    });
  }
};

// =====================================================
// UPDATE EXPENSE
// Admin only
// =====================================================

export const updateExpense = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      category,
      date,
      paymentMethod,
      vendor,
      reference,
      notes,
      invoice,
    } = req.body;

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Expense title cannot be empty",
      });
    }

    if (amount !== undefined && Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Expense amount must be greater than 0",
      });
    }

    // =====================================
    // UPDATE INVOICE RELATIONSHIP
    // =====================================

    if (invoice !== undefined) {
      if (invoice === "" || invoice === null) {
        expense.invoice = null;
      } else {
        const existingInvoice = await Invoice.findById(invoice);

        if (!existingInvoice) {
          return res.status(404).json({
            success: false,
            message: "Invoice not found",
          });
        }

        expense.invoice = existingInvoice._id;
      }
    }

    if (title !== undefined) expense.title = title.trim();

    if (description !== undefined) expense.description = description.trim();

    if (amount !== undefined) expense.amount = Number(amount);

    if (category !== undefined) expense.category = category;

    if (date !== undefined) expense.date = new Date(date);

    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;

    if (vendor !== undefined) expense.vendor = vendor.trim();

    if (reference !== undefined) expense.reference = reference.trim();

    if (notes !== undefined) expense.notes = notes.trim();

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate(
        "invoice",
        "invoiceNumber number customerName customerEmail total",
      )
      .populate("createdBy", "name email role");

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expense: updatedExpense,
    });
  } catch (error) {
    console.error("Update expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update expense",
    });
  }
};

// =====================================================
// DELETE EXPENSE
// Admin only
// =====================================================

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete expense",
    });
  }
};
