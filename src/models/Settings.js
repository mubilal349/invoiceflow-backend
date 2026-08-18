import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // =========================
    // PROFILE / BUSINESS
    // =========================
    profile: {
      name: {
        type: String,
        default: "",
        trim: true,
      },

      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        default: "",
        trim: true,
      },

      companyName: {
        type: String,
        default: "",
        trim: true,
      },

      companyAddress: {
        type: String,
        default: "",
        trim: true,
      },

      city: {
        type: String,
        default: "",
        trim: true,
      },

      country: {
        type: String,
        default: "",
        trim: true,
      },

      taxNumber: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // =========================
    // INVOICE SETTINGS
    // =========================
    invoice: {
      currency: {
        type: String,
        default: "USD",
      },

      invoicePrefix: {
        type: String,
        default: "INV-",
      },

      defaultTax: {
        type: Number,
        default: 0,
        min: 0,
      },

      paymentTerms: {
        type: Number,
        default: 30,
      },

      defaultNotes: {
        type: String,
        default: "",
      },

      footerText: {
        type: String,
        default: "Thank you for your business.",
      },
    },

    // =========================
    // NOTIFICATIONS
    // =========================
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },

      invoiceCreated: {
        type: Boolean,
        default: true,
      },

      paymentReceived: {
        type: Boolean,
        default: true,
      },

      paymentReminder: {
        type: Boolean,
        default: true,
      },

      dueDateReminder: {
        type: Boolean,
        default: true,
      },
    },

    // =========================
    // SECURITY
    // =========================
    security: {
      sessionTimeout: {
        type: Number,
        default: 30,
      },

      loginNotifications: {
        type: Boolean,
        default: true,
      },
    },

    // =========================
    // APPEARANCE
    // =========================
    appearance: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "light",
      },

      language: {
        type: String,
        enum: ["English", "Urdu"],
        default: "English",
      },
    },
  },
  {
    timestamps: true,
  },
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
