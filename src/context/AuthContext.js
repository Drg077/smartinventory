import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser, setCurrentUser as saveCurrentUser, getUsers, storeUser } from '../utils/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const users = await getUsers();
      const foundUser = users.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        await saveCurrentUser(foundUser);
        setUser(foundUser);
        return { success: true, user: foundUser };
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const users = await getUsers();
      
      // Check if user already exists
      if (users.find(u => u.email === email)) {
        return { success: false, error: 'User with this email already exists' };
      }
      
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // In production, this should be hashed
        createdAt: new Date().toISOString(),
      };
      
      await storeUser(newUser);
      await saveCurrentUser(newUser);
      setUser(newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await saveCurrentUser(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
