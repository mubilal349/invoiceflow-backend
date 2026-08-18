import Invoice from "../models/Invoice.js";
import PDFDocument from "pdfkit";
import createNotification from "../utils/createNotification.js";
/*
=========================================
GET ALL INVOICES

ADMIN + USER
=========================================
*/

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error("Get invoices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
    });
  }
};

/*
=========================================
GET SINGLE INVOICE

ADMIN + USER
=========================================
*/

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Get invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
    });
  }
};

/*
=========================================
CREATE INVOICE

ADMIN ONLY
=========================================
*/

/*
=========================================
GET CUSTOMERS FROM INVOICES

ADMIN + USER
=========================================
*/

export const getCustomersFromInvoices = async (req, res) => {
  try {
    const customers = await Invoice.aggregate([
      {
        $match: {
          createdBy: req.user._id,
        },
      },

      {
        $group: {
          // Use email as the main customer identifier
          _id: "$customerEmail",

          customerName: {
            $first: "$customerName",
          },

          customerEmail: {
            $first: "$customerEmail",
          },

          customerAddress: {
            $first: "$customerAddress",
          },

          invoiceCount: {
            $sum: 1,
          },

          totalAmount: {
            $sum: "$total",
          },

          paidAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Paid"] }, "$total", 0],
            },
          },

          pendingAmount: {
            $sum: {
              $cond: [
                {
                  $in: ["$status", ["Pending", "Sent", "Overdue"]],
                },
                "$total",
                0,
              ],
            },
          },

          overdueAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Overdue"] }, "$total", 0],
            },
          },
        },
      },

      {
        $sort: {
          customerName: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Get customers from invoices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      customerName,
      customerEmail,
      customerAddress,
      issueDate,
      dueDate,
      items,
      tax = 0,
      discount = 0,
      status = "Draft",
      notes = "",
    } = req.body;

    // ==============================
    // VALIDATION
    // ==============================

    if (!invoiceNumber || !customerName || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Invoice number, customer name and due date are required",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one invoice item is required",
      });
    }

    // ==============================
    // CHECK DUPLICATE
    // ==============================

    const existingInvoice = await Invoice.findOne({
      invoiceNumber: invoiceNumber.trim(),
    });

    if (existingInvoice) {
      return res.status(409).json({
        success: false,
        message: "Invoice number already exists",
      });
    }

    // ==============================
    // CALCULATE ITEMS
    // ==============================

    const calculatedItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (!item.description?.trim()) {
        throw new Error("Each invoice item must have a description");
      }

      if (quantity < 1) {
        throw new Error("Item quantity must be at least 1");
      }

      if (price < 0) {
        throw new Error("Item price cannot be negative");
      }

      return {
        description: item.description.trim(),
        quantity,
        price,
        total: quantity * price,
      };
    });

    // ==============================
    // CALCULATE SUBTOTAL
    // ==============================

    const subtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);

    // ==============================
    // TAX + DISCOUNT
    // ==============================

    const taxAmount = Math.max(0, Number(tax) || 0);

    const discountAmount = Math.max(0, Number(discount) || 0);

    // ==============================
    // FINAL TOTAL
    // ==============================

    const total = Math.max(0, subtotal + taxAmount - discountAmount);

    // ==============================
    // VALIDATE STATUS
    // ==============================

    const allowedStatuses = [
      "Draft",
      "Sent",
      "Paid",
      "Overdue",
      "Pending",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice status",
      });
    }

    // ==============================
    // CREATE INVOICE
    // ==============================

    const invoice = await Invoice.create({
      invoiceNumber: invoiceNumber.trim(),

      customerName: customerName.trim(),

      customerEmail: customerEmail?.trim().toLowerCase() || "",

      customerAddress: customerAddress?.trim() || "",

      items: calculatedItems,

      subtotal,

      tax: taxAmount,

      discount: discountAmount,

      total,

      issueDate: issueDate || new Date(),

      dueDate,

      status,

      notes: notes || "",

      createdBy: req.user._id,
    });

    // ==============================
    // CREATE NOTIFICATION
    // ==============================

    await createNotification({
      user: req.user._id,

      type: "INVOICE_CREATED",

      title: "Invoice Created",

      message: `Invoice ${invoice.invoiceNumber} for ${
        invoice.customerName
      } was created successfully.`,

      invoice: invoice._id,
    });

    // ==============================
    // RESPONSE
    // ==============================

    return res.status(201).json({
      success: true,

      message: "Invoice created successfully",

      invoice,
    });
  } catch (error) {
    console.error("CREATE INVOICE ERROR:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Failed to create invoice",
    });
  }
};

/*
=========================================
UPDATE INVOICE

ADMIN ONLY
=========================================
*/

export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const {
      invoiceNumber,
      customerName,
      customerEmail,
      customerAddress,
      issueDate,
      dueDate,
      items,
      subtotal,
      tax,
      total,
      status,
      notes,
    } = req.body;

    invoice.invoiceNumber = invoiceNumber ?? invoice.invoiceNumber;

    invoice.customerName = customerName ?? invoice.customerName;

    invoice.customerEmail = customerEmail ?? invoice.customerEmail;

    invoice.customerAddress = customerAddress ?? invoice.customerAddress;

    invoice.issueDate = issueDate ?? invoice.issueDate;

    invoice.dueDate = dueDate ?? invoice.dueDate;

    invoice.items = items ?? invoice.items;

    invoice.subtotal = subtotal ?? invoice.subtotal;

    invoice.tax = tax ?? invoice.tax;

    invoice.total = total ?? invoice.total;

    invoice.status = status ?? invoice.status;

    invoice.notes = notes ?? invoice.notes;

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    console.error("Update invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update invoice",
    });
  }
};

/*
=========================================
DELETE INVOICE

ADMIN ONLY
=========================================
*/

export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Delete invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete invoice",
    });
  }
};

// pdf function

export const downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    );

    doc.pipe(res);

    const dark = "#111827";
    const gray = "#6b7280";
    const border = "#d1d5db";
    const accent = "#111827"; // black accent, swap for a brand color if you like

    const margin = 50;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - margin * 2;

    // =========================
    // HEADER
    // =========================
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor(dark)
      .text("INVOICE", margin, 50);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(gray)
      .text(`#${invoice.invoiceNumber}`, margin, 80);

    // Company / issuer info, right-aligned
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(dark)
      .text(invoice.createdBy?.name || "", margin, 50, {
        align: "right",
        width: contentWidth,
      });

    doc
      .font("Helvetica")
      .fillColor(gray)
      .text(invoice.createdBy?.email || "", margin, 65, {
        align: "right",
        width: contentWidth,
      });

    // Accent rule under header
    doc
      .moveTo(margin, 110)
      .lineTo(pageWidth - margin, 110)
      .lineWidth(1.5)
      .strokeColor(accent)
      .stroke();

    let y = 135;

    // =========================
    // BILL TO  |  INVOICE INFO (two columns)
    // =========================
    const leftColX = margin;
    const rightColX = 330;

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(gray)
      .text("BILL TO", leftColX, y);

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(gray)
      .text("INVOICE DETAILS", rightColX, y);

    y += 16;

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(dark)
      .text(invoice.customerName, leftColX, y, { width: 250 });

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(dark)
      .text(
        `Issue Date:  ${new Date(invoice.issueDate).toLocaleDateString()}`,
        rightColX,
        y,
      );

    y += 16;

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(gray)
      .text(
        `Due Date:  ${new Date(invoice.dueDate).toLocaleDateString()}`,
        rightColX,
        y,
      );

    let leftY = y;
    if (invoice.customerEmail) {
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(gray)
        .text(invoice.customerEmail, leftColX, leftY, { width: 250 });
      leftY += 14;
    }
    if (invoice.customerAddress) {
      doc.text(invoice.customerAddress, leftColX, leftY, { width: 250 });
      leftY += 14;
    }

    y += 16;

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(gray)
      .text(`Status:  `, rightColX, y, { continued: true })
      .font("Helvetica-Bold")
      .fillColor(dark)
      .text(String(invoice.status).toUpperCase());

    y = Math.max(leftY, y) + 30;

    // =========================
    // TABLE
    // =========================
    const tableTop = y;
    const col = {
      desc: margin,
      qty: 320,
      price: 380,
      total: 460,
    };
    const rowPad = 8;

    // Header row — bordered, no fill
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(dark)
      .text("DESCRIPTION", col.desc, tableTop)
      .text("QTY", col.qty, tableTop, { width: 50, align: "right" })
      .text("PRICE", col.price, tableTop, { width: 70, align: "right" })
      .text("TOTAL", col.total, tableTop, { width: 85, align: "right" });

    doc
      .moveTo(margin, tableTop + 18)
      .lineTo(pageWidth - margin, tableTop + 18)
      .lineWidth(1)
      .strokeColor(dark)
      .stroke();

    let rowY = tableTop + 30;

    doc.fontSize(10).font("Helvetica").fillColor(dark);

    invoice.items.forEach((item) => {
      const lineHeight = doc.heightOfString(item.description, { width: 230 });

      doc
        .text(item.description, col.desc, rowY, { width: 230 })
        .text(String(item.quantity), col.qty, rowY, {
          width: 50,
          align: "right",
        })
        .text(`Rs. ${Number(item.price).toLocaleString()}`, col.price, rowY, {
          width: 70,
          align: "right",
        })
        .text(`Rs. ${Number(item.total).toLocaleString()}`, col.total, rowY, {
          width: 85,
          align: "right",
        });

      rowY += Math.max(lineHeight, 14) + 14;

      // thin row divider
      doc
        .moveTo(margin, rowY - 8)
        .lineTo(pageWidth - margin, rowY - 8)
        .lineWidth(0.5)
        .strokeColor(border)
        .stroke();
    });

    // Bottom border of table
    doc
      .moveTo(margin, rowY - 8)
      .lineTo(pageWidth - margin, rowY - 8)
      .lineWidth(1)
      .strokeColor(dark)
      .stroke();

    y = rowY + 15;

    // =========================
    // SUMMARY
    // =========================
    const summaryLabelX = 380;
    const summaryValueX = 460;
    const summaryValueWidth = 85;

    const summaryRow = (label, value, opts = {}) => {
      doc
        .fontSize(opts.bold ? 11 : 10)
        .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
        .fillColor(dark)
        .text(label, summaryLabelX, y, { width: 70, align: "left" })
        .text(value, summaryValueX, y, {
          width: summaryValueWidth,
          align: "right",
        });
      y += opts.bold ? 20 : 16;
    };

    summaryRow("Subtotal", `Rs. ${Number(invoice.subtotal).toLocaleString()}`);
    summaryRow("Tax", `Rs. ${Number(invoice.tax || 0).toLocaleString()}`);
    summaryRow(
      "Discount",
      `- Rs. ${Number(invoice.discount || 0).toLocaleString()}`,
    );

    doc
      .moveTo(summaryLabelX, y)
      .lineTo(pageWidth - margin, y)
      .lineWidth(1)
      .strokeColor(dark)
      .stroke();
    y += 8;

    summaryRow("TOTAL", `Rs. ${Number(invoice.total).toLocaleString()}`, {
      bold: true,
    });

    // =========================
    // NOTES
    // =========================
    if (invoice.notes) {
      y += 25;
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(gray)
        .text("NOTES", margin, y);
      y += 14;
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(dark)
        .text(invoice.notes, margin, y, { width: contentWidth });
    }

    // =========================
    // FOOTER
    // =========================
    doc
      .moveTo(margin, 750)
      .lineTo(pageWidth - margin, 750)
      .lineWidth(0.5)
      .strokeColor(border)
      .stroke();

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(gray)
      .text("Thank you for your business.", margin, 762, {
        align: "center",
        width: contentWidth,
      });

    doc.end();
  } catch (error) {
    console.error("Download invoice PDF error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate invoice PDF",
      });
    }
  }
};
