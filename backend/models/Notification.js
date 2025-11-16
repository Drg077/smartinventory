const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["low_stock", "expiry", "general", "system"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: function () {
        // Notifications expire after 30 days
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        return expiry;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance methods
notificationSchema.methods.toJSON = function () {
  const notification = this.toObject();
  delete notification.__v;
  return notification;
};

notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ userId, isRead: false });
};

notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { userId, isRead: false },
    {
      isRead: true,
      readAt: new Date(),
    }
  );
};

notificationSchema.statics.createLowStockNotification = function (
  userId,
  item
) {
  return this.create({
    userId,
    title: "Low Stock Alert",
    message: `${item.name} is running low (${item.quantity} ${item.unit} remaining)`,
    type: "low_stock",
    priority: "high",
    data: {
      itemId: item._id,
      itemName: item.name,
      currentQuantity: item.quantity,
      minStock: item.minStock,
    },
  });
};

notificationSchema.statics.createExpiryNotification = function (
  userId,
  item,
  daysUntilExpiry
) {
  const priority =
    daysUntilExpiry <= 1 ? "urgent" : daysUntilExpiry <= 3 ? "high" : "medium";
  const message =
    daysUntilExpiry <= 0
      ? `${item.name} has expired`
      : `${item.name} expires in ${daysUntilExpiry} day(s)`;

  return this.create({
    userId,
    title: "Expiry Alert",
    message,
    type: "expiry",
    priority,
    data: {
      itemId: item._id,
      itemName: item.name,
      expiryDate: item.expiryDate,
      daysUntilExpiry,
    },
  });
};

module.exports = mongoose.model("Notification", notificationSchema);
