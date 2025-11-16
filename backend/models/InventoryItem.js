const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: "General",
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: "pcs",
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    minStock: {
      type: Number,
      min: 0,
      default: 0,
    },
    maxStock: {
      type: Number,
      min: 0,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    barcode: {
      type: String,
      trim: true,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    supplier: {
      name: { type: String, trim: true, default: "" },
      contact: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
    },
    images: [
      {
        url: String,
        filename: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["active", "discontinued", "out_of_stock"],
      default: "active",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
inventoryItemSchema.index({ userId: 1, name: 1 });
inventoryItemSchema.index({ userId: 1, category: 1 });
inventoryItemSchema.index({ userId: 1, quantity: 1 });
inventoryItemSchema.index({ userId: 1, expiryDate: 1 });
inventoryItemSchema.index({ userId: 1, createdAt: -1 });
inventoryItemSchema.index({ barcode: 1 }, { sparse: true });

// Virtual for low stock check
inventoryItemSchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.minStock;
});

// Virtual for expired check
inventoryItemSchema.virtual("isExpired").get(function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Virtual for expiring soon check (within 7 days)
inventoryItemSchema.virtual("isExpiringSoon").get(function () {
  if (!this.expiryDate) return false;
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  return this.expiryDate <= sevenDaysFromNow && this.expiryDate > new Date();
});

// Pre-save middleware to update lastUpdated
inventoryItemSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

// Instance methods
inventoryItemSchema.methods.toJSON = function () {
  const item = this.toObject({ virtuals: true });
  delete item.__v;
  return item;
};

inventoryItemSchema.methods.updateQuantity = function (newQuantity) {
  this.quantity = Math.max(0, newQuantity);
  this.lastUpdated = new Date();
  return this.save();
};

inventoryItemSchema.methods.addQuantity = function (amount) {
  this.quantity += amount;
  this.lastUpdated = new Date();
  return this.save();
};

inventoryItemSchema.methods.removeQuantity = function (amount) {
  this.quantity = Math.max(0, this.quantity - amount);
  this.lastUpdated = new Date();
  return this.save();
};

// Static methods
inventoryItemSchema.statics.getLowStockItems = function (userId) {
  return this.find({
    userId,
    $expr: { $lte: ["$quantity", "$minStock"] },
    status: "active",
  });
};

inventoryItemSchema.statics.getExpiringItems = function (userId, days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    userId,
    expiryDate: {
      $gte: new Date(),
      $lte: futureDate,
    },
    status: "active",
  });
};

inventoryItemSchema.statics.getInventoryStats = function (userId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
        categories: { $addToSet: "$category" },
        lowStockCount: {
          $sum: {
            $cond: [{ $lte: ["$quantity", "$minStock"] }, 1, 0],
          },
        },
        outOfStockCount: {
          $sum: {
            $cond: [{ $eq: ["$quantity", 0] }, 1, 0],
          },
        },
      },
    },
  ]);
};

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
