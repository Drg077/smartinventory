import React, { createContext, useState, useEffect, useContext } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { scheduleLowStockNotification } from "../utils/notifications";
import { AuthContext } from "./AuthContext";
import apiService from "../services/api";

export const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadInventory();
    } else {
      setItems([]);
    }
  }, [user]);

  const loadInventory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Use real-time listener for inventory items
      const inventoryRef = collection(db, "inventory", user.uid, "items");
      const q = query(inventoryRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const inventoryItems = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(inventoryItems);
        setLoading(false);
      });

      // Return unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error("Error loading inventory:", error);
      setLoading(false);
    }
  };

  const addItem = async (item) => {
    if (!user) return { success: false, error: "User not logged in" };

    try {
      const result = await apiService.addInventoryItem(item);
      return result;
    } catch (error) {
      console.error("Error adding item:", error);
      return { success: false, error: error.message || "Failed to add item" };
    }
  };

  const updateItem = async (id, updates) => {
    if (!user) return { success: false, error: "User not logged in" };

    try {
      const result = await apiService.updateInventoryItem(id, updates);
      return result;
    } catch (error) {
      console.error("Error updating item:", error);
      return {
        success: false,
        error: error.message || "Failed to update item",
      };
    }
  };

  const deleteItem = async (id) => {
    if (!user) return { success: false, error: "User not logged in" };

    try {
      await apiService.deleteInventoryItem(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting item:", error);
      return {
        success: false,
        error: error.message || "Failed to delete item",
      };
    }
  };

  const addMultipleItems = async (newItems) => {
    if (!user) return { success: false, error: "User not logged in" };

    try {
      const result = await apiService.addMultipleItems(newItems);
      return result;
    } catch (error) {
      console.error("Error adding multiple items:", error);
      return { success: false, error: error.message || "Failed to add items" };
    }
  };

  const checkLowStock = async (item) => {
    if (item.quantity <= (item.minStock || 0)) {
      await scheduleLowStockNotification(
        item.name,
        item.quantity,
        item.minStock || 0
      );
    }
  };

  // Calculate statistics
  const getStats = () => {
    const totalItems = items.length;
    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity * (item.price || 0),
      0
    );
    const lowStockItems = items.filter(
      (item) => item.quantity <= (item.minStock || 0)
    );
    const outOfStockItems = items.filter((item) => item.quantity === 0);

    return {
      totalItems,
      totalValue: totalValue.toFixed(2),
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems,
      outOfStockItems,
    };
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        loading,
        addItem,
        updateItem,
        deleteItem,
        addMultipleItems,
        loadInventory,
        getStats,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
