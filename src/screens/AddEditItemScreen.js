import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, IconButton } from 'react-native-paper';
import { InventoryContext } from '../context/InventoryContext';

export default function AddEditItemScreen({ route, navigation }) {
  const { mode, item } = route.params || { mode: 'add' };
  const { addItem, updateItem } = useContext(InventoryContext);
  
  const [name, setName] = useState(item?.name || '');
  const [quantity, setQuantity] = useState(item?.quantity?.toString() || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [minStock, setMinStock] = useState(item?.minStock?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    navigation.setOptions({
      title: mode === 'edit' ? 'Edit Item' : 'Add Item',
    });
  }, [mode, navigation]);

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }

    const quantityNum = parseInt(quantity) || 0;
    const priceNum = parseFloat(price) || 0;
    const minStockNum = parseInt(minStock) || 0;

    if (quantityNum < 0) {
      setError('Quantity cannot be negative');
      return;
    }

    if (priceNum < 0) {
      setError('Price cannot be negative');
      return;
    }

    if (minStockNum < 0) {
      setError('Minimum stock cannot be negative');
      return;
    }

    setLoading(true);
    setError('');

    const itemData = {
      name: name.trim(),
      quantity: quantityNum,
      price: priceNum,
      minStock: minStockNum,
    };

    let result;
    if (mode === 'edit') {
      result = await updateItem(item.id, itemData);
    } else {
      result = await addItem(itemData);
    }

    setLoading(false);

    if (result.success) {
      navigation.goBack();
    } else {
      setError(result.error || 'Failed to save item');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#5D4037"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          {mode === 'edit' ? 'Edit Item' : 'Add Item'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Surface style={styles.surface} elevation={2}>
          {error ? (
            <Surface style={styles.errorSurface} elevation={1}>
              <Text style={styles.errorText}>{error}</Text>
            </Surface>
          ) : null}

          <TextInput
            label="Item Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            label="Price ($)"
            value={price}
            onChangeText={setPrice}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            label="Minimum Stock Level"
            value={minStock}
            onChangeText={setMinStock}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            disabled={loading}
            helperText="Alert when stock falls below this level"
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.saveButton}
            >
              {mode === 'edit' ? 'Update' : 'Add'} Item
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#FFF8E7',
    borderBottomWidth: 2,
    borderBottomColor: '#CD853F',
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#5D4037',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 48,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
    flexGrow: 1,
  },
  surface: {
    padding: 28,
    borderRadius: 24,
    backgroundColor: '#FEF5E7',
    borderWidth: 3,
    borderColor: '#CD853F',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#FFF8E7',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CD853F',
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#CD853F',
    elevation: 4,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  errorSurface: {
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#FFE5E5',
    borderWidth: 2,
    borderColor: '#D2691E',
    borderStyle: 'dashed',
  },
  errorText: {
    color: '#B71C1C',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
});
