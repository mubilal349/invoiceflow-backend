import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      enum: [
        "Office",
        "Utilities",
        "Rent",
        "Salaries",
        "Marketing",
        "Travel",
        "Equipment",
        "Software",
        "Maintenance",
        "Taxes",
        "Other",
      ],
      default: "Other",
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Credit Card", "Debit Card", "Other"],
      default: "Cash",
    },

    vendor: {
      type: String,
      trim: true,
      default: "",
    },

    reference: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================
    // OPTIONAL INVOICE
    // =====================================

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
