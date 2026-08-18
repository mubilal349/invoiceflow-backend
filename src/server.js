import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import ExpenseRoutes from "./routes/expenseRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

dotenv.config();

const app = express();

// ==========================================
// DATABASE
// ==========================================

connectDB();

// ==========================================
// CORS
// ==========================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://cerulean-wisp-572a51.netlify.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ CORS blocked:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ==========================================
// BODY PARSER
// ==========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/invoices", invoiceRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/expenses", ExpenseRoutes);

app.use("/api/analytics", analyticsRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/settings", settingsRoutes);

// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "InvoiceFlow API is running",
  });
});

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS origin not allowed",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 8000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 InvoiceFlow API running on port ${PORT}`);
});
