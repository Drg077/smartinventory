import React, { createContext, useState, useEffect, useContext } from 'react';
import { getInventory, saveInventory } from '../utils/storage';
import { scheduleLowStockNotification } from '../utils/notifications';
import { AuthContext } from './AuthContext';

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
      const inventory = await getInventory(user.id);
      setItems(inventory);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item) => {
    if (!user) return { success: false, error: 'User not logged in' };
    
    try {
      const newItem = {
        id: Date.now().toString(),
        ...item,
        createdAt: new Date().toISOString(),
      };
      
      const updatedItems = [...items, newItem];
      await saveInventory(user.id, updatedItems);
      setItems(updatedItems);
      
      // Check for low stock
      checkLowStock(newItem);
      
      return { success: true, item: newItem };
    } catch (error) {
      console.error('Error adding item:', error);
      return { success: false, error: 'Failed to add item' };
    }
  };

  const updateItem = async (id, updates) => {
    if (!user) return { success: false, error: 'User not logged in' };
    
    try {
      const updatedItems = items.map(item => 
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      );
      
      await saveInventory(user.id, updatedItems);
      setItems(updatedItems);
      
      // Check for low stock
      const updatedItem = updatedItems.find(item => item.id === id);
      if (updatedItem) {
        checkLowStock(updatedItem);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating item:', error);
      return { success: false, error: 'Failed to update item' };
    }
  };

  const deleteItem = async (id) => {
    if (!user) return { success: false, error: 'User not logged in' };
    
    try {
      const updatedItems = items.filter(item => item.id !== id);
      await saveInventory(user.id, updatedItems);
      setItems(updatedItems);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting item:', error);
      return { success: false, error: 'Failed to delete item' };
    }
  };

  const addMultipleItems = async (newItems) => {
    if (!user) return { success: false, error: 'User not logged in' };
    
    try {
      const itemsWithIds = newItems.map(item => ({
        id: `${Date.now()}-${Math.random()}`,
        ...item,
        createdAt: new Date().toISOString(),
      }));
      
      const updatedItems = [...items, ...itemsWithIds];
      await saveInventory(user.id, updatedItems);
      setItems(updatedItems);
      
      // Check for low stock on all new items
      itemsWithIds.forEach(item => checkLowStock(item));
      
      return { success: true, items: itemsWithIds };
    } catch (error) {
      console.error('Error adding multiple items:', error);
      return { success: false, error: 'Failed to add items' };
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
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);
    const lowStockItems = items.filter(item => item.quantity <= (item.minStock || 0));
    const outOfStockItems = items.filter(item => item.quantity === 0);
    
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
