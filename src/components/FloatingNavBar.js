import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

export default function FloatingNavBar() {
  const navigation = useNavigation();
  const route = useRoute();
  const { logout } = useContext(AuthContext);

  // Don't render if route is not available
  if (!route || !route.name) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    {
      key: 'Dashboard',
      label: 'Dashboard',
      icon: 'view-dashboard-outline',
      route: 'Dashboard',
    },
    {
      key: 'InventoryList',
      label: 'Inventory',
      icon: 'package-variant-closed',
      route: 'InventoryList',
    },
    {
      key: 'OCRScan',
      label: 'Scan',
      icon: 'camera-outline',
      route: 'OCRScan',
    },
    {
      key: 'Logout',
      label: 'Logout',
      icon: 'logout-variant',
      action: handleLogout,
    },
  ];

  const isActive = (item) => {
    if (item.route && route) {
      return route.name === item.route;
    }
    return false;
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => {
                if (item.action) {
                  item.action();
                } else if (item.route) {
                  navigation.navigate(item.route);
                }
              }}
              activeOpacity={0.7}
            >
              <IconButton
                icon={item.icon}
                size={24}
                iconColor={active ? '#FFF8E7' : '#8D6E63'}
                style={styles.iconButton}
              />
              <Text
                variant="labelSmall"
                style={[
                  styles.navLabel,
                  active && styles.navLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FEF5E7',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 3,
    borderColor: '#CD853F',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    minWidth: '85%',
    maxWidth: '90%',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1,
    minWidth: 70,
  },
  navItemActive: {
    backgroundColor: '#CD853F',
  },
  iconButton: {
    margin: 0,
    padding: 0,
  },
  navLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#8D6E63',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  navLabelActive: {
    color: '#FFF8E7',
    fontWeight: 'bold',
  },
});
