// Firebase configuration for the Smart Inventory app
// This file should be customized with your actual Firebase project settings

const firebaseConfig = {
  // Replace with your Firebase project configuration
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id", // Optional, for Analytics
};

// For React Native, you'll also need these additional configs
const androidConfig = {
  ...firebaseConfig,
  // Android-specific configuration
  googleServicesFile: "google-services.json", // Path to your google-services.json
};

const iosConfig = {
  ...firebaseConfig,
  // iOS-specific configuration
  googleServicesPlist: "GoogleService-Info.plist", // Path to your GoogleService-Info.plist
};

module.exports = {
  firebaseConfig,
  androidConfig,
  iosConfig,
};

// Environment-specific configurations
const developmentConfig = {
  ...firebaseConfig,
  // Use Firebase emulators for development
  useEmulator: true,
  emulatorConfig: {
    auth: {
      host: "localhost",
      port: 9099,
    },
    firestore: {
      host: "localhost",
      port: 8080,
    },
    storage: {
      host: "localhost",
      port: 9199,
    },
    functions: {
      host: "localhost",
      port: 5001,
    },
  },
};

const productionConfig = {
  ...firebaseConfig,
  useEmulator: false,
};

module.exports.developmentConfig = developmentConfig;
module.exports.productionConfig = productionConfig;
