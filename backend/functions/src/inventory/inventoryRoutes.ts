import { Router } from "express";
import { verifyToken } from "../auth/authRoutes";
import { InventoryService } from "./inventoryService";

const router = Router();
const inventoryService = new InventoryService();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all inventory items for user
router.get("/", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const items = await inventoryService.getUserInventory(userId);
    res.status(200).json(items);
  } catch (error) {
    console.error("Get inventory error:", error);
    res.status(500).json({
      error: "Failed to fetch inventory",
    });
  }
});

// Get single inventory item
router.get("/:itemId", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { itemId } = req.params;

    const item = await inventoryService.getInventoryItem(userId, itemId);
    res.status(200).json(item);
  } catch (error) {
    console.error("Get inventory item error:", error);
    res.status(404).json({
      error: "Item not found",
    });
  }
});

// Add new inventory item
router.post("/", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const itemData = req.body;

    // Validate required fields
    if (!itemData.name) {
      return res.status(400).json({
        error: "Item name is required",
      });
    }

    const result = await inventoryService.addInventoryItem(userId, itemData);
    res.status(201).json(result);
  } catch (error) {
    console.error("Add inventory item error:", error);
    res.status(500).json({
      error: "Failed to add item",
    });
  }
});

// Add multiple inventory items (for OCR batch import)
router.post("/batch", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Items array is required",
      });
    }

    const result = await inventoryService.addMultipleItems(userId, items);
    res.status(201).json(result);
  } catch (error) {
    console.error("Batch add items error:", error);
    res.status(500).json({
      error: "Failed to add items",
    });
  }
});

// Update inventory item
router.put("/:itemId", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { itemId } = req.params;
    const updates = req.body;

    const result = await inventoryService.updateInventoryItem(
      userId,
      itemId,
      updates
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Update inventory item error:", error);
    res.status(500).json({
      error: "Failed to update item",
    });
  }
});

// Delete inventory item
router.delete("/:itemId", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { itemId } = req.params;

    await inventoryService.deleteInventoryItem(userId, itemId);
    res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Delete inventory item error:", error);
    res.status(500).json({
      error: "Failed to delete item",
    });
  }
});

// Get inventory statistics
router.get("/stats/summary", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const stats = await inventoryService.getInventoryStats(userId);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Get inventory stats error:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
    });
  }
});

// Get low stock items
router.get("/alerts/low-stock", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const lowStockItems = await inventoryService.getLowStockItems(userId);
    res.status(200).json(lowStockItems);
  } catch (error) {
    console.error("Get low stock items error:", error);
    res.status(500).json({
      error: "Failed to fetch low stock items",
    });
  }
});

// Search inventory items
router.get("/search/:query", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { query } = req.params;

    const results = await inventoryService.searchInventoryItems(userId, query);
    res.status(200).json(results);
  } catch (error) {
    console.error("Search inventory error:", error);
    res.status(500).json({
      error: "Failed to search items",
    });
  }
});

export { router as inventoryRoutes };
