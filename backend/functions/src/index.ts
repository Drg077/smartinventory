import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";
import * as express from "express";

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app with CORS
const app = express();
app.use(cors({ origin: true }));

// Import route handlers
import { authRoutes } from "./auth/authRoutes";
import { inventoryRoutes } from "./inventory/inventoryRoutes";
import { ocrRoutes } from "./ocr/ocrRoutes";
import { notificationRoutes } from "./notifications/notificationRoutes";

// Import triggers
import {
  onInventoryItemCreate,
  onInventoryItemUpdate,
} from "./inventory/inventoryTriggers";
import { onImageUpload } from "./ocr/ocrTriggers";
import { scheduledLowStockCheck } from "./notifications/scheduledNotifications";

// API Routes
app.use("/auth", authRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/ocr", ocrRoutes);
app.use("/notifications", notificationRoutes);

// Export the main API function
export const api = functions.https.onRequest(app);

// Export Firestore triggers
export const onInventoryCreate = onInventoryItemCreate;
export const onInventoryUpdate = onInventoryItemUpdate;

// Export Storage triggers
export const processOCRImage = onImageUpload;

// Export scheduled functions
export const dailyLowStockCheck = scheduledLowStockCheck;

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Default route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Smart Inventory API",
    version: "1.0.0",
    endpoints: {
      auth: "/auth",
      inventory: "/inventory",
      ocr: "/ocr",
      notifications: "/notifications",
      health: "/health",
    },
  });
});
