import Customer from "../models/Customer.js";
import Invoice from "../models/Invoice.js";

// =========================================
// GET ALL CUSTOMERS
// =========================================

export const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;

    let filter = {};

    if (search) {
      filter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { company: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const customers = await Customer.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};

// =========================================
// GET SINGLE CUSTOMER
// =========================================

export const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
};

// =========================================
// CREATE CUSTOMER
// =========================================

export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, company, address, city, country, notes } =
      req.body;

    // Required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Customer name and email are required",
      });
    }

    // Check duplicate email
    const existingCustomer = await Customer.findOne({
      email: email.toLowerCase(),
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "A customer with this email already exists",
      });
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      company,
      address,
      city,
      country,
      notes,
      createdBy: req.user._id,
    });

    const populatedCustomer = await Customer.findById(customer._id).populate(
      "createdBy",
      "name email",
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: populatedCustomer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};

// =========================================
// UPDATE CUSTOMER
// =========================================

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const { name, email, phone, company, address, city, country, notes } =
      req.body;

    // Check if email belongs to another customer
    if (email) {
      const existingCustomer = await Customer.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.params.id },
      });

      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message: "Another customer already uses this email",
        });
      }
    }

    customer.name = name ?? customer.name;
    customer.email = email?.toLowerCase() ?? customer.email;
    customer.phone = phone ?? customer.phone;
    customer.company = company ?? customer.company;
    customer.address = address ?? customer.address;
    customer.city = city ?? customer.city;
    customer.country = country ?? customer.country;
    customer.notes = notes ?? customer.notes;

    await customer.save();

    const updatedCustomer = await Customer.findById(customer._id).populate(
      "createdBy",
      "name email",
    );

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};

// =========================================
// DELETE CUSTOMER
// =========================================

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if customer has invoices
    const invoiceCount = await Invoice.countDocuments({
      customer: customer._id,
    });

    if (invoiceCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "This customer cannot be deleted because they have existing invoices",
      });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
};

// =========================================
// GET CUSTOMER INVOICES
// =========================================

export const getCustomerInvoices = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const invoices = await Invoice.find({
      customer: customer._id,
    })
      .populate("customer", "name email phone company")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("Get customer invoices error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customer invoices",
    });
  }
};
