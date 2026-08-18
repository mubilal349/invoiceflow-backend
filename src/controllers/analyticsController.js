import Invoice from "../models/Invoice.js";
import Expense from "../models/Expense.js";

// =====================================================
// GET ANALYTICS
// =====================================================

export const getAnalytics = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    const now = new Date();

    let startDate;
    let endDate;

    // =========================================
    // DATE RANGE
    // =========================================

    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);

      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
    } else if (period === "lastMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);

      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);

      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
    }

    // =========================================
    // LOAD DATA
    // =========================================

    const invoices = await Invoice.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).lean();

    const expenses = await Expense.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).lean();

    // =========================================
    // REVENUE
    // =========================================

    const revenue = invoices.reduce((sum, invoice) => {
      return (
        sum +
        Number(
          invoice.totalAmount ??
            invoice.total ??
            invoice.grandTotal ??
            invoice.amount ??
            0,
        )
      );
    }, 0);

    // =========================================
    // EXPENSES
    // =========================================

    const totalExpenses = expenses.reduce((sum, expense) => {
      return sum + Number(expense.amount || 0);
    }, 0);

    // =========================================
    // PROFIT
    // =========================================

    const profit = revenue - totalExpenses;

    // =========================================
    // INVOICE STATUS
    // =========================================

    const invoiceStatus = {
      paid: 0,
      pending: 0,
      overdue: 0,
      draft: 0,
      cancelled: 0,
    };

    invoices.forEach((invoice) => {
      const status = String(invoice.status || "pending").toLowerCase();

      if (status === "paid") {
        invoiceStatus.paid++;
      } else if (status === "overdue") {
        invoiceStatus.overdue++;
      } else if (status === "draft") {
        invoiceStatus.draft++;
      } else if (status === "cancelled" || status === "canceled") {
        invoiceStatus.cancelled++;
      } else {
        invoiceStatus.pending++;
      }
    });

    // =========================================
    // EXPENSE CATEGORIES
    // =========================================

    const categoryMap = {};

    expenses.forEach((expense) => {
      const category = expense.category || "Other";

      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }

      categoryMap[category] += Number(expense.amount || 0);
    });

    const expenseCategories = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    // =========================================
    // TOP CUSTOMERS
    // =========================================

    const customerMap = {};

    invoices.forEach((invoice) => {
      const customerName =
        invoice.customerName || invoice.customerEmail || "Unknown Customer";

      const amount = Number(
        invoice.totalAmount ??
          invoice.total ??
          invoice.grandTotal ??
          invoice.amount ??
          0,
      );

      if (!customerMap[customerName]) {
        customerMap[customerName] = {
          customerName,
          invoices: 0,
          revenue: 0,
        };
      }

      customerMap[customerName].invoices++;

      customerMap[customerName].revenue += amount;
    });

    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // =========================================
    // MONTHLY DATA
    // =========================================

    const monthlyData = [];

    for (let month = 0; month < 12; month++) {
      const monthRevenue = invoices
        .filter((invoice) => {
          const date = new Date(invoice.createdAt);

          return date.getMonth() === month;
        })
        .reduce(
          (sum, invoice) =>
            sum +
            Number(
              invoice.totalAmount ??
                invoice.total ??
                invoice.grandTotal ??
                invoice.amount ??
                0,
            ),
          0,
        );

      const monthExpenses = expenses
        .filter((expense) => {
          const date = new Date(expense.date);

          return date.getMonth() === month;
        })
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

      monthlyData.push({
        month: new Date(now.getFullYear(), month, 1).toLocaleString("default", {
          month: "short",
        }),

        revenue: monthRevenue,

        expenses: monthExpenses,

        profit: monthRevenue - monthExpenses,
      });
    }

    // =========================================
    // RESPONSE
    // =========================================

    res.status(200).json({
      success: true,

      analytics: {
        revenue,

        expenses: totalExpenses,

        profit,

        invoiceCount: invoices.length,

        expenseCount: expenses.length,

        averageInvoice: invoices.length > 0 ? revenue / invoices.length : 0,

        invoiceStatus,

        expenseCategories,

        topCustomers,

        monthlyData,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);

    res.status(500).json({
      success: false,

      message: "Failed to load analytics",

      error: error.message,
    });
  }
};
