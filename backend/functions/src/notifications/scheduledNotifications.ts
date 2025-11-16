import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { NotificationService } from "./notificationService";
import { InventoryService } from "../inventory/inventoryService";

const notificationService = new NotificationService();
const inventoryService = new InventoryService();

// Scheduled function to check for low stock items daily
export const scheduledLowStockCheck = functions.pubsub
  .schedule("0 9 * * *") // Run daily at 9 AM
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      console.log("Running scheduled low stock check...");

      // Get all users
      const usersSnapshot = await admin.firestore().collection("users").get();

      let totalUsersChecked = 0;
      let totalLowStockNotifications = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        try {
          // Get user's notification settings
          const settings = await notificationService.getNotificationSettings(
            userId
          );

          if (!settings.lowStockAlerts) {
            console.log(`Low stock alerts disabled for user: ${userId}`);
            continue;
          }

          // Get low stock items for this user
          const lowStockResult = await inventoryService.getLowStockItems(
            userId
          );

          if (lowStockResult.items.length > 0) {
            // Send daily summary notification
            const title = "Daily Low Stock Summary";
            const body = `You have ${lowStockResult.items.length} item(s) running low on stock`;

            await notificationService.sendNotification(userId, {
              type: "daily_low_stock_summary",
              title,
              body,
              data: {
                lowStockCount: lowStockResult.items.length,
                items: lowStockResult.items.slice(0, 5), // Include top 5 items
              },
              priority: "normal",
            });

            totalLowStockNotifications++;
            console.log(
              `Sent low stock summary to user ${userId}: ${lowStockResult.items.length} items`
            );
          }

          totalUsersChecked++;
        } catch (userError) {
          console.error(
            `Error checking low stock for user ${userId}:`,
            userError
          );
        }
      }

      console.log(
        `Scheduled low stock check completed. Users checked: ${totalUsersChecked}, Notifications sent: ${totalLowStockNotifications}`
      );

      // Log the activity
      await admin.firestore().collection("system_logs").add({
        type: "scheduled_low_stock_check",
        usersChecked: totalUsersChecked,
        notificationsSent: totalLowStockNotifications,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Scheduled low stock check error:", error);

      // Log the error
      await admin
        .firestore()
        .collection("system_logs")
        .add({
          type: "scheduled_low_stock_check_error",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
  });

// Scheduled function to send weekly inventory summary
export const scheduledWeeklySummary = functions.pubsub
  .schedule("0 10 * * 1") // Run every Monday at 10 AM
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      console.log("Running scheduled weekly summary...");

      const usersSnapshot = await admin.firestore().collection("users").get();
      let summariesSent = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        try {
          // Get user's notification settings
          const settings = await notificationService.getNotificationSettings(
            userId
          );

          if (!settings.dailySummary) {
            continue;
          }

          // Get inventory stats
          const stats = await inventoryService.getInventoryStats(userId);

          const title = "Weekly Inventory Summary";
          const body = `Total items: ${stats.stats.totalItems}, Value: $${stats.stats.totalValue}, Low stock: ${stats.stats.lowStockCount}`;

          await notificationService.sendNotification(userId, {
            type: "weekly_summary",
            title,
            body,
            data: stats.stats,
            priority: "low",
          });

          summariesSent++;
          console.log(`Sent weekly summary to user: ${userId}`);
        } catch (userError) {
          console.error(
            `Error sending weekly summary to user ${userId}:`,
            userError
          );
        }
      }

      console.log(`Weekly summary completed. Summaries sent: ${summariesSent}`);

      // Log the activity
      await admin.firestore().collection("system_logs").add({
        type: "scheduled_weekly_summary",
        summariesSent,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Scheduled weekly summary error:", error);
    }
  });

// Scheduled function to clean up old notifications
export const scheduledNotificationCleanup = functions.pubsub
  .schedule("0 2 * * 0") // Run every Sunday at 2 AM
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      console.log("Running scheduled notification cleanup...");

      // Delete notifications older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const usersSnapshot = await admin.firestore().collection("users").get();
      let totalDeleted = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        try {
          const oldNotificationsSnapshot = await admin
            .firestore()
            .collection("notifications")
            .doc(userId)
            .collection("messages")
            .where("timestamp", "<", thirtyDaysAgo)
            .get();

          if (oldNotificationsSnapshot.size > 0) {
            const batch = admin.firestore().batch();

            oldNotificationsSnapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });

            await batch.commit();
            totalDeleted += oldNotificationsSnapshot.size;

            console.log(
              `Deleted ${oldNotificationsSnapshot.size} old notifications for user: ${userId}`
            );
          }
        } catch (userError) {
          console.error(
            `Error cleaning notifications for user ${userId}:`,
            userError
          );
        }
      }

      console.log(
        `Notification cleanup completed. Total deleted: ${totalDeleted}`
      );

      // Log the activity
      await admin.firestore().collection("system_logs").add({
        type: "scheduled_notification_cleanup",
        notificationsDeleted: totalDeleted,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Scheduled notification cleanup error:", error);
    }
  });

// Scheduled function to clean up old OCR results
export const scheduledOCRCleanup = functions.pubsub
  .schedule("0 3 * * 0") // Run every Sunday at 3 AM
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      console.log("Running scheduled OCR cleanup...");

      // Delete OCR results older than 60 days
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const oldOCRSnapshot = await admin
        .firestore()
        .collection("ocr_results")
        .where("processedAt", "<", sixtyDaysAgo)
        .get();

      let deletedCount = 0;
      const batch = admin.firestore().batch();
      const bucket = admin.storage().bucket();

      for (const doc of oldOCRSnapshot.docs) {
        const data = doc.data();

        // Delete associated image from storage
        if (data.imageUrl) {
          try {
            const filename = data.imageUrl.split("/").pop();
            if (filename) {
              await bucket
                .file(`ocr-images/${data.userId}/${filename}`)
                .delete();
            }
          } catch (storageError) {
            console.warn("Failed to delete OCR image:", storageError);
          }
        }

        // Delete Firestore document
        batch.delete(doc.ref);
        deletedCount++;
      }

      if (deletedCount > 0) {
        await batch.commit();
      }

      console.log(`OCR cleanup completed. Deleted: ${deletedCount} results`);

      // Log the activity
      await admin.firestore().collection("system_logs").add({
        type: "scheduled_ocr_cleanup",
        ocrResultsDeleted: deletedCount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Scheduled OCR cleanup error:", error);
    }
  });
