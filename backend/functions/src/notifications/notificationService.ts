import * as admin from "firebase-admin";

export interface NotificationSettings {
  lowStockAlerts: boolean;
  ocrCompletionAlerts: boolean;
  restockReminders: boolean;
  dailySummary: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

export interface UserNotification {
  id?: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  timestamp: admin.firestore.Timestamp;
  read: boolean;
  priority: "low" | "normal" | "high";
}

export class NotificationService {
  private db = admin.firestore();
  private messaging = admin.messaging();

  async registerFCMToken(userId: string, fcmToken: string, platform?: string) {
    try {
      await this.db
        .collection("user_tokens")
        .doc(userId)
        .set(
          {
            fcmToken,
            platform: platform || "unknown",
            registeredAt: admin.firestore.FieldValue.serverTimestamp(),
            active: true,
          },
          { merge: true }
        );

      console.log(`FCM token registered for user: ${userId}`);
    } catch (error) {
      console.error("Register FCM token error:", error);
      throw error;
    }
  }

  async sendLowStockNotification(
    userId: string,
    itemName: string,
    currentStock: number,
    minStock: number
  ) {
    try {
      const title = "Low Stock Alert!";
      const body = `${itemName} is running low. Current: ${currentStock}, Min: ${minStock}`;

      await this.sendNotification(userId, {
        type: "low_stock",
        title,
        body,
        data: {
          itemName,
          currentStock,
          minStock,
        },
        priority: "high",
      });

      console.log(
        `Low stock notification sent for ${itemName} to user: ${userId}`
      );
    } catch (error) {
      console.error("Send low stock notification error:", error);
      throw error;
    }
  }

  async sendRestockNotification(
    userId: string,
    itemName: string,
    newStock: number
  ) {
    try {
      const title = "Item Restocked";
      const body = `${itemName} has been restocked. New quantity: ${newStock}`;

      await this.sendNotification(userId, {
        type: "restock",
        title,
        body,
        data: {
          itemName,
          newStock,
        },
        priority: "normal",
      });

      console.log(
        `Restock notification sent for ${itemName} to user: ${userId}`
      );
    } catch (error) {
      console.error("Send restock notification error:", error);
      throw error;
    }
  }

  async sendOCRCompletionNotification(
    userId: string,
    itemsFound: number,
    ocrResultId: string
  ) {
    try {
      const title = "OCR Processing Complete";
      const body = `Found ${itemsFound} items in your uploaded image`;

      await this.sendNotification(userId, {
        type: "ocr_complete",
        title,
        body,
        data: {
          itemsFound,
          ocrResultId,
        },
        priority: "normal",
      });

      console.log(`OCR completion notification sent to user: ${userId}`);
    } catch (error) {
      console.error("Send OCR completion notification error:", error);
      throw error;
    }
  }

  async sendTestNotification(
    userId: string,
    title?: string,
    body?: string,
    data?: any
  ) {
    try {
      await this.sendNotification(userId, {
        type: "test",
        title: title || "Test Notification",
        body: body || "This is a test notification from Smart Inventory",
        data: data || { test: true },
        priority: "normal",
      });

      console.log(`Test notification sent to user: ${userId}`);
    } catch (error) {
      console.error("Send test notification error:", error);
      throw error;
    }
  }

  private async sendNotification(
    userId: string,
    notification: Partial<UserNotification>
  ) {
    try {
      // Check notification settings
      const settings = await this.getNotificationSettings(userId);

      if (!settings.pushNotifications) {
        console.log(`Push notifications disabled for user: ${userId}`);
        return;
      }

      // Check specific notification type settings
      if (notification.type === "low_stock" && !settings.lowStockAlerts) {
        return;
      }
      if (
        notification.type === "ocr_complete" &&
        !settings.ocrCompletionAlerts
      ) {
        return;
      }

      // Save notification to Firestore
      const notificationData: Partial<UserNotification> = {
        userId,
        type: notification.type || "general",
        title: notification.title || "",
        body: notification.body || "",
        data: notification.data || {},
        timestamp:
          admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        read: false,
        priority: notification.priority || "normal",
      };

      const docRef = await this.db
        .collection("notifications")
        .doc(userId)
        .collection("messages")
        .add(notificationData);

      // Send push notification
      await this.sendPushNotification(
        userId,
        notification.title!,
        notification.body!,
        notification.data
      );

      return docRef.id;
    } catch (error) {
      console.error("Send notification error:", error);
      throw error;
    }
  }

  private async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ) {
    try {
      // Get user's FCM token
      const tokenDoc = await this.db
        .collection("user_tokens")
        .doc(userId)
        .get();

      if (!tokenDoc.exists) {
        console.log(`No FCM token found for user: ${userId}`);
        return;
      }

      const tokenData = tokenDoc.data();
      if (!tokenData?.fcmToken || !tokenData.active) {
        console.log(`Invalid or inactive FCM token for user: ${userId}`);
        return;
      }

      // Send push notification
      const message = {
        token: tokenData.fcmToken,
        notification: {
          title,
          body,
        },
        data: data
          ? Object.keys(data).reduce((acc, key) => {
              acc[key] = String(data[key]);
              return acc;
            }, {} as { [key: string]: string })
          : {},
        android: {
          notification: {
            channelId: "inventory_alerts",
            priority: "high" as const,
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: (await this.getUnreadNotificationCount(userId)) + 1,
            },
          },
        },
      };

      await this.messaging.send(message);
      console.log(`Push notification sent to user: ${userId}`);
    } catch (error: any) {
      console.error("Send push notification error:", error);

      // Handle invalid token
      if (error.code === "messaging/registration-token-not-registered") {
        await this.db.collection("user_tokens").doc(userId).update({
          active: false,
        });
      }
    }
  }

  async getUserNotifications(
    userId: string,
    limit: number = 20,
    unreadOnly: boolean = false
  ) {
    try {
      let query = this.db
        .collection("notifications")
        .doc(userId)
        .collection("messages")
        .orderBy("timestamp", "desc")
        .limit(limit);

      if (unreadOnly) {
        query = query.where("read", "==", false);
      }

      const snapshot = await query.get();
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        notifications,
        count: notifications.length,
      };
    } catch (error) {
      console.error("Get user notifications error:", error);
      throw error;
    }
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    try {
      await this.db
        .collection("notifications")
        .doc(userId)
        .collection("messages")
        .doc(notificationId)
        .update({
          read: true,
          readAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: string) {
    try {
      const snapshot = await this.db
        .collection("notifications")
        .doc(userId)
        .collection("messages")
        .where("read", "==", false)
        .get();

      const batch = this.db.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();

      return {
        success: true,
        markedCount: snapshot.docs.length,
      };
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      throw error;
    }
  }

  async deleteNotification(userId: string, notificationId: string) {
    try {
      await this.db
        .collection("notifications")
        .doc(userId)
        .collection("messages")
        .doc(notificationId)
        .delete();
    } catch (error) {
      console.error("Delete notification error:", error);
      throw error;
    }
  }

  async clearAllNotifications(userId: string) {
    try {
      const snapshot = await this.db
        .collection("notifications")
        .doc(userId)
        .collection("messages")
        .get();

      const batch = this.db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return {
        success: true,
        deletedCount: snapshot.docs.length,
      };
    } catch (error) {
      console.error("Clear all notifications error:", error);
      throw error;
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const snapshot = await this.db
        .collection("notifications")
        .doc(userId)
        .collection("messages")
        .where("read", "==", false)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error("Get unread notification count error:", error);
      return 0;
    }
  }

  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const doc = await this.db
        .collection("notification_settings")
        .doc(userId)
        .get();

      if (!doc.exists) {
        // Return default settings
        const defaultSettings: NotificationSettings = {
          lowStockAlerts: true,
          ocrCompletionAlerts: true,
          restockReminders: true,
          dailySummary: false,
          pushNotifications: true,
          emailNotifications: false,
        };

        // Save default settings
        await this.db
          .collection("notification_settings")
          .doc(userId)
          .set(defaultSettings);

        return defaultSettings;
      }

      return doc.data() as NotificationSettings;
    } catch (error) {
      console.error("Get notification settings error:", error);
      throw error;
    }
  }

  async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ) {
    try {
      await this.db
        .collection("notification_settings")
        .doc(userId)
        .update({
          ...settings,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return {
        success: true,
        message: "Notification settings updated successfully",
      };
    } catch (error) {
      console.error("Update notification settings error:", error);
      throw error;
    }
  }
}
