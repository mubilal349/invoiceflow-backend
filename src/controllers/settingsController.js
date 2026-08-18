import bcrypt from "bcryptjs";
import Settings from "../models/Settings.js";
import User from "../models/User.js";

// ==========================================
// GET SETTINGS
// ==========================================

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({
      user: req.user._id,
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({
        user: req.user._id,

        profile: {
          name: req.user.name || "",
          email: req.user.email || "",
        },
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load settings",
    });
  }
};

// ==========================================
// UPDATE SETTINGS
// ==========================================

export const updateSettings = async (req, res) => {
  try {
    const { profile, invoice, notifications, security, appearance } = req.body;

    let settings = await Settings.findOne({
      user: req.user._id,
    });

    if (!settings) {
      settings = new Settings({
        user: req.user._id,
      });
    }

    if (profile) {
      settings.profile = {
        ...settings.profile.toObject(),
        ...profile,
      };
    }

    if (invoice) {
      settings.invoice = {
        ...settings.invoice.toObject(),
        ...invoice,
      };
    }

    if (notifications) {
      settings.notifications = {
        ...settings.notifications.toObject(),
        ...notifications,
      };
    }

    if (security) {
      settings.security = {
        ...settings.security.toObject(),
        ...security,
      };
    }

    if (appearance) {
      settings.appearance = {
        ...settings.appearance.toObject(),
        ...appearance,
      };
    }

    await settings.save();

    // Update user name/email as well
    if (profile?.name || profile?.email) {
      const user = await User.findById(req.user._id);

      if (user) {
        if (profile.name) {
          user.name = profile.name;
        }

        if (profile.email) {
          user.email = profile.email.toLowerCase();
        }

        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("UPDATE SETTINGS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
};

// ==========================================
// CHANGE PASSWORD
// ==========================================

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};
