import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USERS: '@inventory_app:users',
  CURRENT_USER: '@inventory_app:current_user',
  INVENTORY: '@inventory_app:inventory',
};

// User storage
export const storeUser = async (user) => {
  try {
    const users = await getUsers();
    const updatedUsers = [...users, user];
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    return true;
  } catch (error) {
    console.error('Error storing user:', error);
    return false;
  }
};

export const getUsers = async () => {
  try {
    const users = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const setCurrentUser = async (user) => {
  try {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    return true;
  } catch (error) {
    console.error('Error setting current user:', error);
    return false;
  }
};

// Inventory storage
export const getInventory = async (userId) => {
  try {
    const allInventory = await AsyncStorage.getItem(STORAGE_KEYS.INVENTORY);
    const inventory = allInventory ? JSON.parse(allInventory) : {};
    return inventory[userId] || [];
  } catch (error) {
    console.error('Error getting inventory:', error);
    return [];
  }
};

export const saveInventory = async (userId, items) => {
  try {
    const allInventory = await AsyncStorage.getItem(STORAGE_KEYS.INVENTORY);
    const inventory = allInventory ? JSON.parse(allInventory) : {};
    inventory[userId] = items;
    await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    return true;
  } catch (error) {
    console.error('Error saving inventory:', error);
    return false;
  }
};
