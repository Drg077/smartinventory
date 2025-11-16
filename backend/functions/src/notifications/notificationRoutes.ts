import { Router } from "express";
import { verifyToken } from "../auth/authRoutes";
import { NotificationService } from "./notificationService";

const router = Router();
const notificationService = new NotificationService();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Register FCM token for push notifications
router.post("/register-token", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { fcmToken, platform } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        error: "FCM token is required",
      });
    }

    await notificationService.registerFCMToken(userId, fcmToken, platform);
    res.status(200).json({
      success: true,
      message: "FCM token registered successfully",
    });
  } catch (error) {
    console.error("Register FCM token error:", error);
    res.status(500).json({
      error: "Failed to register FCM token",
    });
  }
});

// Get user notifications
router.get("/", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const notifications = await notificationService.getUserNotifications(
      userId,
      limit,
      unreadOnly
    );
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      error: "Failed to fetch notifications",
    });
  }
});

// Mark notification as read
router.put("/:notificationId/read", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { notificationId } = req.params;

    await notificationService.markNotificationAsRead(userId, notificationId);
    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({
      error: "Failed to mark notification as read",
    });
  }
});

// Mark all notifications as read
router.put("/read-all", async (req: any, res) => {
  try {
    const userId = req.user.uid;

    const result = await notificationService.markAllNotificationsAsRead(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({
      error: "Failed to mark all notifications as read",
    });
  }
});

// Delete notification
router.delete("/:notificationId", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { notificationId } = req.params;

    await notificationService.deleteNotification(userId, notificationId);
    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      error: "Failed to delete notification",
    });
  }
});

// Clear all notifications
router.delete("/", async (req: any, res) => {
  try {
    const userId = req.user.uid;

    const result = await notificationService.clearAllNotifications(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Clear all notifications error:", error);
    res.status(500).json({
      error: "Failed to clear notifications",
    });
  }
});

// Send test notification
router.post("/test", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { title, body, data } = req.body;

    await notificationService.sendTestNotification(userId, title, body, data);
    res.status(200).json({
      success: true,
      message: "Test notification sent",
    });
  } catch (error) {
    console.error("Send test notification error:", error);
    res.status(500).json({
      error: "Failed to send test notification",
    });
  }
});

// Get notification settings
router.get("/settings", async (req: any, res) => {
  try {
    const userId = req.user.uid;

    const settings = await notificationService.getNotificationSettings(userId);
    res.status(200).json(settings);
  } catch (error) {
    console.error("Get notification settings error:", error);
    res.status(500).json({
      error: "Failed to fetch notification settings",
    });
  }
});

// Update notification settings
router.put("/settings", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const settings = req.body;

    const result = await notificationService.updateNotificationSettings(
      userId,
      settings
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({
      error: "Failed to update notification settings",
    });
  }
});

// Get unread notification count
router.get("/unread-count", async (req: any, res) => {
  try {
    const userId = req.user.uid;

    const count = await notificationService.getUnreadNotificationCount(userId);
    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      error: "Failed to fetch unread count",
    });
  }
});

export { router as notificationRoutes };
