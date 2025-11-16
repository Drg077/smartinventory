import * as admin from "firebase-admin";

export interface InventoryItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  minStock: number;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

export class InventoryService {
  private db = admin.firestore();

  async getUserInventory(userId: string) {
    try {
      const snapshot = await this.db
        .collection("inventory")
        .doc(userId)
        .collection("items")
        .orderBy("createdAt", "desc")
        .get();

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        items,
        count: items.length,
      };
    } catch (error) {
      console.error("Get user inventory error:", error);
      throw error;
    }
  }

  async getInventoryItem(userId: string, itemId: string) {
    try {
      const doc = await this.db
        .collection("inventory")
        .doc(userId)
        .collection("items")
        .doc(itemId)
        .get();

      if (!doc.exists) {
        throw new Error("Item not found");
      }

      return {
        success: true,
        item: {
          id: doc.id,
          ...doc.data(),
        },
      };
    } catch (error) {
      console.error("Get inventory item error:", error);
      throw error;
    }
  }

  async addInventoryItem(userId: string, itemData: Partial<InventoryItem>) {
    try {
      const item: InventoryItem = {
        name: itemData.name || "",
        quantity: itemData.quantity || 0,
        price: itemData.price || 0,
        minStock: itemData.minStock || 0,
        createdAt:
          admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      };

      // Validate item data
      if (!item.name.trim()) {
        throw new Error("Item name is required");
      }

      if (item.quantity < 0) {
        throw new Error("Quantity cannot be negative");
      }

      if (item.price < 0) {
        throw new Error("Price cannot be negative");
      }

      if (item.minStock < 0) {
        throw new Error("Minimum stock cannot be negative");
      }

      const docRef = await this.db
        .collection("inventory")
        .doc(userId)
        .collection("items")
        .add(item);

      return {
        success: true,
        item: {
          id: docRef.id,
          ...item,
        },
      };
    } catch (error) {
      console.error("Add inventory item error:", error);
      throw error;
    }
  }

  async addMultipleItems(userId: string, items: Partial<InventoryItem>[]) {
    try {
      const batch = this.db.batch();
      const addedItems: any[] = [];

      for (const itemData of items) {
        const item: InventoryItem = {
          name: itemData.name || "",
          quantity: itemData.quantity || 0,
          price: itemData.price || 0,
          minStock: itemData.minStock || 0,
          createdAt:
            admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
          updatedAt:
            admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        };

        // Basic validation
        if (!item.name.trim()) {
          continue; // Skip invalid items
        }

        const docRef = this.db
          .collection("inventory")
          .doc(userId)
          .collection("items")
          .doc();

        batch.set(docRef, item);
        addedItems.push({
          id: docRef.id,
          ...item,
        });
      }

      await batch.commit();

      return {
        success: true,
        items: addedItems,
        count: addedItems.length,
      };
    } catch (error) {
      console.error("Add multiple items error:", error);
      throw error;
    }
  }

  async updateInventoryItem(
    userId: string,
    itemId: string,
    updates: Partial<InventoryItem>
  ) {
    try {
      const allowedUpdates = ["name", "quantity", "price", "minStock"];
      const filteredUpdates: any = {};

      // Filter only allowed updates
      allowedUpdates.forEach((field) => {
        if (updates[field as keyof InventoryItem] !== undefined) {
          filteredUpdates[field] = updates[field as keyof InventoryItem];
        }
      });

      if (Object.keys(filteredUpdates).length === 0) {
        throw new Error("No valid updates provided");
      }

      // Validate updates
      if (filteredUpdates.name !== undefined && !filteredUpdates.name.trim()) {
        throw new Error("Item name cannot be empty");
      }

      if (
        filteredUpdates.quantity !== undefined &&
        filteredUpdates.quantity < 0
      ) {
        throw new Error("Quantity cannot be negative");
      }

      if (filteredUpdates.price !== undefined && filteredUpdates.price < 0) {
        throw new Error("Price cannot be negative");
      }

      if (
        filteredUpdates.minStock !== undefined &&
        filteredUpdates.minStock < 0
      ) {
        throw new Error("Minimum stock cannot be negative");
      }

      filteredUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      await this.db
        .collection("inventory")
        .doc(userId)
        .collection("items")
        .doc(itemId)
        .update(filteredUpdates);

      return {
        success: true,
        message: "Item updated successfully",
      };
    } catch (error) {
      console.error("Update inventory item error:", error);
      throw error;
    }
  }

  async deleteInventoryItem(userId: string, itemId: string) {
    try {
      await this.db
        .collection("inventory")
        .doc(userId)
        .collection("items")
        .doc(itemId)
        .delete();

      return {
        success: true,
        message: "Item deleted successfully",
      };
    } catch (error) {
      console.error("Delete inventory item error:", error);
      throw error;
    }
  }

  async getInventoryStats(userId: string) {
    try {
      const snapshot = await this.db
        .collection("inventory")
        .doc(userId)
        .collection("items")
        .get();

      const items = snapshot.docs.map((doc) => doc.data() as InventoryItem);

      const totalItems = items.length;
      const totalValue = items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
      const lowStockItems = items.filter(
        (item) => item.quantity <= item.minStock
      );
      const outOfStockItems = items.filter((item) => item.quantity === 0);

      return {
        success: true,
        stats: {
          totalItems,
          totalValue: parseFloat(totalValue.toFixed(2)),
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length,
          lowStockItems: lowStockItems.slice(0, 5), // Return top 5 for preview
          outOfStockItems: outOfStockItems.slice(0, 5), // Return top 5 for preview
        },
      };
    } catch (error) {
      console.error("Get inventory stats error:", error);
      throw error;
    }
  }

  async getLowStockItems(userId: string) {
    try {
      const snapshot = await this.db
        .collection("inventory")
        .doc(userId)
        .collection("items")
        .get();

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (InventoryItem & { id: string })[];

      const lowStockItems = items.filter(
        (item) => item.quantity <= item.minStock
      );

      return {
        success: true,
        items: lowStockItems,
        count: lowStockItems.length,
      };
    } catch (error) {
      console.error("Get low stock items error:", error);
      throw error;
    }
  }

  async searchInventoryItems(userId: string, query: string) {
    try {
      const snapshot = await this.db
        .collection("inventory")
        .doc(userId)
        .collection("items")
        .get();

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (InventoryItem & { id: string })[];

      // Simple text search (in production, consider using Algolia or similar)
      const searchResults = items.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );

      return {
        success: true,
        items: searchResults,
        count: searchResults.length,
        query,
      };
    } catch (error) {
      console.error("Search inventory items error:", error);
      throw error;
    }
  }
}
