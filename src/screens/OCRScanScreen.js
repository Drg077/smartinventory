import React, { useState, useEffect, useContext } from "react";
import { View, StyleSheet, ScrollView, Image, Alert } from "react-native";
import {
  Button,
  Text,
  Surface,
  ActivityIndicator,
  Card,
  IconButton,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import apiService from "../services/api";
import { InventoryContext } from "../context/InventoryContext";
import FloatingNavBar from "../components/FloatingNavBar";

export default function OCRScanScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const { addMultipleItems } = useContext(InventoryContext);

  useEffect(() => {
    // Request camera permissions on mount
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        // Permission not granted, but user can still use image picker
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Media library permission is required to select images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        setOcrResult(null);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera permission is required to take photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        setOcrResult(null);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const processImage = async () => {
    if (!image) {
      Alert.alert("No Image", "Please select or take a photo first.");
      return;
    }

    setProcessing(true);
    setOcrResult(null);

    try {
      const result = await apiService.processOCRImage(image);
      setProcessing(false);
      setOcrResult(result);
    } catch (error) {
      setProcessing(false);
      console.error("OCR processing error:", error);
      Alert.alert("Error", "Failed to process image. Please try again.");
    }
  };

  const handleAddItems = async () => {
    if (!ocrResult || !ocrResult.success || ocrResult.items.length === 0) {
      Alert.alert("No Items", "No items were extracted from the image.");
      return;
    }

    const result = await addMultipleItems(ocrResult.items);

    if (result.success) {
      Alert.alert(
        "Success",
        `Added ${result.items.length} item(s) to inventory.`,
        [
          {
            text: "OK",
            onPress: () => {
              setImage(null);
              setOcrResult(null);
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      Alert.alert("Error", result.error || "Failed to add items to inventory.");
    }
  };

  const clearImage = () => {
    setImage(null);
    setOcrResult(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Surface style={styles.surface} elevation={2}>
          <Text variant="headlineSmall" style={styles.title}>
            Scan Bill/Receipt
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Use OCR to automatically extract items from bills or receipts
          </Text>

          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              icon="camera"
              onPress={takePhoto}
              style={[styles.actionButton, styles.cameraButton]}
              disabled={processing}
            >
              Take Photo
            </Button>
            <Button
              mode="outlined"
              icon="image"
              onPress={pickImage}
              style={[styles.actionButton, styles.galleryButton]}
              disabled={processing}
            >
              Pick Image
            </Button>
          </View>

          {image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              <IconButton
                icon="close"
                iconColor="#fff"
                size={20}
                style={styles.closeButton}
                onPress={clearImage}
              />
            </View>
          )}

          {image && !processing && (
            <Button
              mode="contained"
              onPress={processImage}
              style={styles.processButton}
              icon="text-recognition"
            >
              Process Image
            </Button>
          )}

          {processing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" />
              <Text variant="bodyMedium" style={styles.processingText}>
                Processing image with OCR...
              </Text>
            </View>
          )}

          {ocrResult && (
            <View style={styles.resultContainer}>
              {ocrResult.success ? (
                <>
                  <Text variant="titleMedium" style={styles.resultTitle}>
                    Extracted Items ({ocrResult.items.length})
                  </Text>

                  {ocrResult.items.map((item, index) => (
                    <Card key={index} style={styles.itemCard} mode="outlined">
                      <Card.Content>
                        <Text variant="bodyLarge" style={styles.itemName}>
                          {item.name}
                        </Text>
                        <Text variant="bodyMedium">
                          Quantity: {item.quantity}
                          {item.price > 0 &&
                            ` | Price: $${item.price.toFixed(2)}`}
                        </Text>
                      </Card.Content>
                    </Card>
                  ))}

                  <Button
                    mode="contained"
                    onPress={handleAddItems}
                    style={styles.addButton}
                    icon="check"
                  >
                    Add All Items to Inventory
                  </Button>
                </>
              ) : (
                <Surface style={styles.errorSurface} elevation={1}>
                  <Text style={styles.errorText}>
                    Failed to extract items.{" "}
                    {ocrResult.error || "Please try with a clearer image."}
                  </Text>
                </Surface>
              )}
            </View>
          )}
        </Surface>
      </ScrollView>
      <FloatingNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  surface: {
    padding: 28,
    borderRadius: 24,
    backgroundColor: "#FEF5E7",
    borderWidth: 3,
    borderColor: "#CD853F",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#5D4037",
    fontSize: 26,
    letterSpacing: 0.5,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 32,
    textAlign: "center",
    color: "#6D4C41",
    fontSize: 15,
    fontStyle: "italic",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 28,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  cameraButton: {
    backgroundColor: "#CD853F",
  },
  galleryButton: {
    borderWidth: 2,
    borderColor: "#CD853F",
  },
  imageContainer: {
    position: "relative",
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#D2691E",
    backgroundColor: "#FFF8E7",
    elevation: 4,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
    backgroundColor: "#FFF8E7",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(139, 69, 19, 0.7)",
    borderRadius: 20,
  },
  processButton: {
    marginBottom: 28,
    borderRadius: 16,
    backgroundColor: "#CD853F",
    elevation: 4,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  processingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  processingText: {
    marginTop: 20,
    opacity: 0.8,
    color: "#6D4C41",
    fontSize: 15,
    fontStyle: "italic",
  },
  resultContainer: {
    marginTop: 20,
  },
  resultTitle: {
    fontWeight: "bold",
    marginBottom: 20,
    color: "#5D4037",
    fontSize: 20,
    letterSpacing: 0.3,
  },
  itemCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#D2691E",
    backgroundColor: "#FFF8E7",
    elevation: 2,
  },
  itemName: {
    fontWeight: "bold",
    marginBottom: 6,
    color: "#5D4037",
    fontSize: 17,
  },
  addButton: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: "#CD853F",
    elevation: 4,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  errorSurface: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#FFE5E5",
    borderWidth: 2,
    borderColor: "#D2691E",
    borderStyle: "dashed",
  },
  errorText: {
    color: "#B71C1C",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
  },
});
