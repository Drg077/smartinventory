import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { NotificationService } from "../notifications/notificationService";

const notificationService = new NotificationService();

// Trigger when a new inventory item is created
export const onInventoryItemCreate = functions.firestore
  .document("inventory/{userId}/items/{itemId}")
  .onCreate(async (snapshot, context) => {
    try {
      const { userId, itemId } = context.params;
      const itemData = snapshot.data();

      console.log(`New inventory item created: ${itemId} for user: ${userId}`);

      // Check if item is already low stock
      if (itemData.quantity <= itemData.minStock) {
        await notificationService.sendLowStockNotification(
          userId,
          itemData.name,
          itemData.quantity,
          itemData.minStock
        );
      }

      // Log activity
      await admin
        .firestore()
        .collection("activity_logs")
        .doc(userId)
        .collection("logs")
        .add({
          type: "item_created",
          itemId,
          itemName: itemData.name,
          quantity: itemData.quantity,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error("Error in onInventoryItemCreate trigger:", error);
    }
  });

// Trigger when an inventory item is updated
export const onInventoryItemUpdate = functions.firestore
  .document("inventory/{userId}/items/{itemId}")
  .onUpdate(async (change, context) => {
    try {
      const { userId, itemId } = context.params;
      const beforeData = change.before.data();
      const afterData = change.after.data();

      console.log(`Inventory item updated: ${itemId} for user: ${userId}`);

      // Check if quantity changed and now below minimum stock
      const quantityChanged = beforeData.quantity !== afterData.quantity;
      const nowLowStock = afterData.quantity <= afterData.minStock;
      const wasNotLowStock = beforeData.quantity > beforeData.minStock;

      if (quantityChanged && nowLowStock && wasNotLowStock) {
        await notificationService.sendLowStockNotification(
          userId,
          afterData.name,
          afterData.quantity,
          afterData.minStock
        );
      }

      // Check if item went from out of stock to in stock
      const wasOutOfStock = beforeData.quantity === 0;
      const nowInStock = afterData.quantity > 0;

      if (wasOutOfStock && nowInStock) {
        await notificationService.sendRestockNotification(
          userId,
          afterData.name,
          afterData.quantity
        );
      }

      // Log significant changes
      const significantChanges = [];

      if (beforeData.quantity !== afterData.quantity) {
        significantChanges.push({
          field: "quantity",
          before: beforeData.quantity,
          after: afterData.quantity,
        });
      }

      if (beforeData.price !== afterData.price) {
        significantChanges.push({
          field: "price",
          before: beforeData.price,
          after: afterData.price,
        });
      }

      if (significantChanges.length > 0) {
        await admin
          .firestore()
          .collection("activity_logs")
          .doc(userId)
          .collection("logs")
          .add({
            type: "item_updated",
            itemId,
            itemName: afterData.name,
            changes: significantChanges,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
      }
    } catch (error) {
      console.error("Error in onInventoryItemUpdate trigger:", error);
    }
  });

// Trigger when an inventory item is deleted
export const onInventoryItemDelete = functions.firestore
  .document("inventory/{userId}/items/{itemId}")
  .onDelete(async (snapshot, context) => {
    try {
      const { userId, itemId } = context.params;
      const itemData = snapshot.data();

      console.log(`Inventory item deleted: ${itemId} for user: ${userId}`);

      // Log deletion
      await admin
        .firestore()
        .collection("activity_logs")
        .doc(userId)
        .collection("logs")
        .add({
          type: "item_deleted",
          itemId,
          itemName: itemData.name,
          lastQuantity: itemData.quantity,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error("Error in onInventoryItemDelete trigger:", error);
    }
  });
