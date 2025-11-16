const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const InventoryItem = require("../models/InventoryItem");
const Notification = require("../models/Notification");

// Get all inventory items
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;
    const {
      page = 1,
      limit = 50,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      status = "active",
    } = req.query;

    const query = { userId, status };

    if (category && category !== "all") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const items = await InventoryItem.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await InventoryItem.countDocuments(query);

    res.json({
      success: true,
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get inventory error:", error);
    res.status(500).json({ error: "Failed to get inventory items" });
  }
});

// Get single inventory item
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;
    const item = await InventoryItem.findOne({ _id: req.params.id, userId });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("Get item error:", error);
    res.status(500).json({ error: "Failed to get item" });
  }
});

// Add new inventory item
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;
    const itemData = { ...req.body, userId };

    const item = new InventoryItem(itemData);
    await item.save();

    // Check for low stock and create notification if needed
    if (item.isLowStock) {
      await Notification.createLowStockNotification(userId, item);
    }

    res.status(201).json({
      success: true,
      message: "Item added successfully",
      item,
    });
  } catch (error) {
    console.error("Add item error:", error);
    res.status(500).json({ error: "Failed to add item" });
  }
});

// Add multiple inventory items
router.post("/batch", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required" });
    }

    const itemsWithUserId = items.map((item) => ({ ...item, userId }));
    const createdItems = await InventoryItem.insertMany(itemsWithUserId);

    // Check for low stock items and create notifications
    const lowStockItems = createdItems.filter((item) => item.isLowStock);
    for (const item of lowStockItems) {
      await Notification.createLowStockNotification(userId, item);
    }

    res.status(201).json({
      success: true,
      message: `Added ${createdItems.length} items successfully`,
      items: createdItems,
    });
  } catch (error) {
    console.error("Add batch items error:", error);
    res.status(500).json({ error: "Failed to add items" });
  }
});

// Update inventory item
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;
    const updates = req.body;

    const item = await InventoryItem.findOneAndUpdate(
      { _id: req.params.id, userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Check for low stock and create notification if needed
    if (item.isLowStock) {
      // Check if we already have a recent low stock notification
      const recentNotification = await Notification.findOne({
        userId,
        type: "low_stock",
        "data.itemId": item._id,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      });

      if (!recentNotification) {
        await Notification.createLowStockNotification(userId, item);
      }
    }

    res.json({
      success: true,
      message: "Item updated successfully",
      item,
    });
  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Delete inventory item
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    const item = await InventoryItem.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Get inventory statistics
router.get("/stats/summary", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    const [stats, lowStockItems, expiringItems] = await Promise.all([
      InventoryItem.getInventoryStats(userId),
      InventoryItem.getLowStockItems(userId),
      InventoryItem.getExpiringItems(userId, 7),
    ]);

    const summary = stats[0] || {
      totalItems: 0,
      totalQuantity: 0,
      totalValue: 0,
      categories: [],
      lowStockCount: 0,
      outOfStockCount: 0,
    };

    res.json({
      success: true,
      stats: {
        ...summary,
        expiringCount: expiringItems.length,
        lowStockItems: lowStockItems.slice(0, 5), // Top 5 low stock items
        expiringItems: expiringItems.slice(0, 5), // Top 5 expiring items
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to get inventory statistics" });
  }
});

// Get categories
router.get("/categories/list", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    const categories = await InventoryItem.distinct("category", { userId });

    res.json({
      success: true,
      categories: categories.sort(),
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to get categories" });
  }
});

// Update item quantity (for quick adjustments)
router.patch("/:id/quantity", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;
    const { quantity, operation = "set" } = req.body;

    if (typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({ error: "Valid quantity is required" });
    }

    const item = await InventoryItem.findOne({ _id: req.params.id, userId });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    switch (operation) {
      case "add":
        await item.addQuantity(quantity);
        break;
      case "subtract":
        await item.removeQuantity(quantity);
        break;
      case "set":
      default:
        await item.updateQuantity(quantity);
        break;
    }

    // Check for low stock
    if (item.isLowStock) {
      await Notification.createLowStockNotification(userId, item);
    }

    res.json({
      success: true,
      message: "Quantity updated successfully",
      item,
    });
  } catch (error) {
    console.error("Update quantity error:", error);
    res.status(500).json({ error: "Failed to update quantity" });
  }
});

module.exports = router;
