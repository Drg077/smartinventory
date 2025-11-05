import React, { useContext, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, FAB, Surface, useTheme } from 'react-native-paper';
import { InventoryContext } from '../context/InventoryContext';
import { AuthContext } from '../context/AuthContext';
import FloatingNavBar from '../components/FloatingNavBar';

export default function DashboardScreen({ navigation }) {
  const { items, getStats, loadInventory, loading } = useContext(InventoryContext);
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const stats = getStats();

  useEffect(() => {
    loadInventory();
  }, []);

  const onRefresh = () => {
    loadInventory();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        <Surface style={styles.header} elevation={2}>
          <Text variant="headlineSmall" style={styles.welcomeText}>
            Welcome, {user?.name || 'User'}!
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Inventory Overview
          </Text>
        </Surface>

        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, { backgroundColor: '#E8D5C4' }]} mode="elevated" elevation={3}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.statNumber}>
                {stats.totalItems}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Total Items
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: '#F5DEB3' }]} mode="elevated" elevation={3}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.statNumber}>
                ${stats.totalValue}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Total Value
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: '#DEB887' }]} mode="elevated" elevation={3}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.statNumber}>
                {stats.lowStockCount}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Low Stock
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: '#D2B48C' }]} mode="elevated" elevation={3}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.statNumber}>
                {stats.outOfStockCount}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Out of Stock
              </Text>
            </Card.Content>
          </Card>
        </View>

        {stats.lowStockItems.length > 0 && (
          <Card style={styles.alertCard} mode="elevated" elevation={3}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.alertTitle}>
                ⚠️ Low Stock Alerts
              </Text>
              {stats.lowStockItems.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.alertItem}>
                  <Text variant="bodyMedium" style={styles.alertItemName}>{item.name}</Text>
                  <Text variant="bodySmall" style={styles.alertStock}>
                    Stock: {item.quantity} (Min: {item.minStock})
                  </Text>
                </View>
              ))}
              {stats.lowStockItems.length > 5 && (
                <Text variant="bodySmall" style={styles.moreText}>
                  + {stats.lowStockItems.length - 5} more items
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        <Card 
          style={styles.actionCard} 
          mode="elevated" 
          elevation={4}
          onPress={() => navigation.navigate('InventoryList')}
        >
          <Card.Content style={styles.actionCardContent}>
            <Text variant="titleMedium" style={styles.actionCardTitle}>
              📦 View All Items
            </Text>
            <Text variant="bodySmall" style={styles.actionCardSubtitle}>
              Browse and manage your complete inventory list
            </Text>
          </Card.Content>
        </Card>

        <Card 
          style={styles.actionCard} 
          mode="elevated" 
          elevation={4}
          onPress={() => navigation.navigate('OCRScan')}
        >
          <Card.Content style={styles.actionCardContent}>
            <Text variant="titleMedium" style={styles.actionCardTitle}>
              📷 Scan Bill/Receipt
            </Text>
            <Text variant="bodySmall" style={styles.actionCardSubtitle}>
              Use OCR to automatically add items from bills
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditItem', { mode: 'add' })}
        label="Add Item"
      />
      <FloatingNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: '#F5E6D3',
    borderWidth: 2,
    borderColor: '#CD853F',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  welcomeText: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#5D4037',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  subtitle: {
    opacity: 0.8,
    color: '#6D4C41',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D2691E',
    overflow: 'hidden',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#5D4037',
    letterSpacing: 1,
  },
  statLabel: {
    opacity: 0.8,
    color: '#6D4C41',
    fontSize: 13,
    fontWeight: '500',
  },
  alertCard: {
    marginBottom: 20,
    backgroundColor: '#FFF0DB',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FF8C42',
  },
  alertTitle: {
    fontWeight: 'bold',
    marginBottom: 14,
    color: '#D2691E',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  alertItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB380',
    borderStyle: 'dashed',
  },
  alertItemName: {
    color: '#5D4037',
    fontWeight: '600',
  },
  alertStock: {
    opacity: 0.8,
    marginTop: 4,
    color: '#8D6E63',
    fontSize: 12,
  },
  moreText: {
    marginTop: 10,
    fontStyle: 'italic',
    opacity: 0.7,
    color: '#8D6E63',
  },
  actionCard: {
    marginBottom: 16,
    backgroundColor: '#E8DCC6',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CD853F',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  actionCardContent: {
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  actionCardTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#5D4037',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  actionCardSubtitle: {
    opacity: 0.75,
    color: '#6D4C41',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: '#CD853F',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
