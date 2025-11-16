const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const Notification = require("../models/Notification");

// Get user notifications
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;

    const query = { userId };

    if (unreadOnly === "true") {
      query.isRead = false;
    }

    if (type && type !== "all") {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
});

// Mark notification as read
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    const notification = await Notification.findOne({
      _id: req.params.id,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    const result = await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// Delete notification
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// Create manual notification (admin/system use)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;
    const {
      title,
      message,
      type = "general",
      priority = "medium",
      data = {},
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    const notification = new Notification({
      userId,
      title,
      message,
      type,
      priority,
      data,
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// Get notification statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    const stats = await Notification.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] } },
          byType: {
            $push: {
              type: "$type",
              isRead: "$isRead",
            },
          },
          byPriority: {
            $push: {
              priority: "$priority",
              isRead: "$isRead",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          unread: 1,
          read: { $subtract: ["$total", "$unread"] },
          typeBreakdown: {
            $reduce: {
              input: "$byType",
              initialValue: {},
              in: {
                $mergeObjects: [
                  "$$value",
                  {
                    $arrayToObject: [
                      [
                        {
                          k: "$$this.type",
                          v: {
                            $add: [
                              {
                                $ifNull: [
                                  {
                                    $getField: {
                                      field: "$$this.type",
                                      input: "$$value",
                                    },
                                  },
                                  0,
                                ],
                              },
                              1,
                            ],
                          },
                        },
                      ],
                    ],
                  },
                ],
              },
            },
          },
          priorityBreakdown: {
            $reduce: {
              input: "$byPriority",
              initialValue: {},
              in: {
                $mergeObjects: [
                  "$$value",
                  {
                    $arrayToObject: [
                      [
                        {
                          k: "$$this.priority",
                          v: {
                            $add: [
                              {
                                $ifNull: [
                                  {
                                    $getField: {
                                      field: "$$this.priority",
                                      input: "$$value",
                                    },
                                  },
                                  0,
                                ],
                              },
                              1,
                            ],
                          },
                        },
                      ],
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      unread: 0,
      read: 0,
      typeBreakdown: {},
      priorityBreakdown: {},
    };

    res.json({
      success: true,
      stats: result,
    });
  } catch (error) {
    console.error("Get notification stats error:", error);
    res.status(500).json({ error: "Failed to get notification statistics" });
  }
});

// Register FCM token (for push notifications - placeholder)
router.post("/register-token", authenticateToken, async (req, res) => {
  try {
    const { fcmToken, platform } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    // Store FCM token in user document
    const user = req.user;
    if (!user.fcmTokens) {
      user.fcmTokens = [];
    }

    // Remove existing token for this platform
    user.fcmTokens = user.fcmTokens.filter(
      (token) => token.platform !== platform
    );

    // Add new token
    user.fcmTokens.push({
      token: fcmToken,
      platform: platform || "unknown",
      registeredAt: new Date(),
    });

    await user.save();

    res.json({
      success: true,
      message: "FCM token registered successfully",
    });
  } catch (error) {
    console.error("Register FCM token error:", error);
    res.status(500).json({ error: "Failed to register FCM token" });
  }
});

module.exports = router;
