import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { List, Card, Text, Searchbar, FAB, IconButton, Chip } from 'react-native-paper';
import { InventoryContext } from '../context/InventoryContext';
import FloatingNavBar from '../components/FloatingNavBar';

export default function InventoryListScreen({ navigation }) {
  const { items, deleteItem, loadInventory, loading } = useContext(InventoryContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  const handleDelete = async (id) => {
    await deleteItem(id);
  };

  const getStockStatus = (item) => {
    if (item.quantity === 0) return { label: 'Out of Stock', color: '#f44336' };
    if (item.quantity <= (item.minStock || 0)) return { label: 'Low Stock', color: '#ff9800' };
    return { label: 'In Stock', color: '#4caf50' };
  };

  const renderItem = ({ item }) => {
    const status = getStockStatus(item);
    
    return (
      <Card style={styles.card} mode="outlined" onPress={() => navigation.navigate('AddEditItem', { mode: 'edit', item })}>
        <Card.Content>
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text variant="titleMedium" style={styles.itemName}>
                {item.name}
              </Text>
              <Chip
                style={[styles.statusChip, { backgroundColor: `${status.color}20` }]}
                textStyle={{ color: status.color, fontSize: 12 }}
                compact
              >
                {status.label}
              </Chip>
            </View>
            <IconButton
              icon="delete"
              iconColor="#f44336"
              size={20}
              onPress={() => handleDelete(item.id)}
            />
          </View>
          
          <View style={styles.itemDetails}>
            <Text variant="bodyMedium">
              Quantity: <Text style={styles.bold}>{item.quantity}</Text>
            </Text>
            {item.minStock !== undefined && (
              <Text variant="bodySmall" style={styles.minStock}>
                Min Stock: {item.minStock}
              </Text>
            )}
            {item.price > 0 && (
              <Text variant="bodyMedium">
                Price: <Text style={styles.bold}>${item.price.toFixed(2)}</Text>
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search items..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadInventory} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No items found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Add your first item to get started'}
            </Text>
          </View>
        }
      />

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
  searchbar: {
    margin: 20,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FEF5E7',
    elevation: 2,
  },
  listContent: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#FEF5E7',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D2691E',
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#5D4037',
    fontSize: 18,
    letterSpacing: 0.3,
  },
  statusChip: {
    alignSelf: 'flex-start',
    height: 26,
    borderRadius: 12,
  },
  itemDetails: {
    marginTop: 6,
  },
  bold: {
    fontWeight: 'bold',
    color: '#5D4037',
  },
  minStock: {
    opacity: 0.75,
    marginTop: 6,
    color: '#8D6E63',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    opacity: 0.7,
    marginBottom: 12,
    color: '#8D6E63',
    fontSize: 18,
    fontStyle: 'italic',
  },
  emptySubtext: {
    opacity: 0.6,
    textAlign: 'center',
    color: '#8D6E63',
    fontSize: 14,
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
