const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const User = require("../models/User");

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Delete user account
router.delete("/account", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    // Delete user data from MongoDB
    await User.findOneAndDelete({ firebaseUid: userId });

    // Note: Firebase user deletion should be handled on the frontend
    // or you can delete it here using admin.auth().deleteUser(userId)

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// Get user statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const InventoryItem = require("../models/InventoryItem");
    const Notification = require("../models/Notification");

    const userId = req.user.firebaseUid;

    const [inventoryStats, unreadNotifications] = await Promise.all([
      InventoryItem.getInventoryStats(userId),
      Notification.getUnreadCount(userId),
    ]);

    const stats = inventoryStats[0] || {
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
        ...stats,
        unreadNotifications,
        memberSince: req.user.createdAt,
        lastLogin: req.user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to get user statistics" });
  }
});

module.exports = router;
