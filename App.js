import React, { useEffect, useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, DefaultTheme, configureFonts } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { InventoryProvider } from './src/context/InventoryContext';
import { requestNotificationPermissions } from './src/utils/notifications';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import InventoryListScreen from './src/screens/InventoryListScreen';
import AddEditItemScreen from './src/screens/AddEditItemScreen';
import OCRScanScreen from './src/screens/OCRScanScreen';

const Stack = createNativeStackNavigator();

// Vintage Retro Theme Configuration
const fontConfig = {
  web: {
    regular: {
      fontFamily: 'Georgia, serif',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'Georgia, serif',
      fontWeight: 'bold',
    },
    light: {
      fontFamily: 'Georgia, serif',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'Georgia, serif',
      fontWeight: '100',
    },
  },
  ios: {
    regular: {
      fontFamily: 'Georgia',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'Georgia',
      fontWeight: 'bold',
    },
  },
  android: {
    regular: {
      fontFamily: 'serif',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'serif',
      fontWeight: 'bold',
    },
  },
};

const theme = {
  ...DefaultTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...DefaultTheme.colors,
    primary: '#CD853F', // Peru - warm terracotta
    accent: '#D2691E', // Chocolate - burnt orange
    background: '#FFF8E7', // Creamy warm white
    surface: '#FEF5E7', // Antique white
    text: '#3E2723', // Deep brown
    placeholder: '#8D6E63', // Muted brown
    backdrop: 'rgba(62, 39, 35, 0.7)',
    onSurface: '#5D4037', // Brown
    onBackground: '#4E342E', // Dark brown
    disabled: '#A1887F', // Light brown
    error: '#B71C1C', // Deep red
    notification: '#FF6B35', // Vibrant orange
  },
  roundness: 16, // More rounded corners for retro feel
};

// Main App Navigator Component
function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    // Request notification permissions on app start
    requestNotificationPermissions();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CD853F" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
            />
          </>
        ) : (
          // Main App Stack - All headers hidden, using floating navbar instead
          <>
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
            />
            <Stack.Screen
              name="InventoryList"
              component={InventoryListScreen}
            />
            <Stack.Screen
              name="AddEditItem"
              component={AddEditItemScreen}
            />
            <Stack.Screen
              name="OCRScan"
              component={OCRScanScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Main App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <InventoryProvider>
            <AppNavigator />
            <StatusBar style="light" />
          </InventoryProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
});
