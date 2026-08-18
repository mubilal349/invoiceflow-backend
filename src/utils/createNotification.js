import Notification from "../models/Notification.js";

const createNotification = async ({
  user,
  type,
  title,
  message,
  invoice = null,
  expense = null,
}) => {
  try {
    const notification = await Notification.create({
      user,
      type,
      title,
      message,
      invoice,
      expense,
    });

    console.log("✅ Notification created:", notification._id);

    return notification;
  } catch (error) {
    console.error("❌ CREATE NOTIFICATION ERROR:", error);

    return null;
  }
};

export default createNotification;
