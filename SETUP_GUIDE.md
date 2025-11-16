# Smart Inventory App - Complete Setup Guide

## 📋 Prerequisites

Before starting, make sure you have:

- Node.js (v18 or higher) installed
- npm or yarn package manager
- Expo CLI: `npm install -g @expo/cli`
- Firebase CLI: `npm install -g firebase-tools`
- A Google account for Firebase

## 🔥 Step 1: Create Firebase Project

### 1.1 Create Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `smart-inventory-app` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click **"Create project"**

### 1.2 Enable Firebase Services

In your Firebase project console:

**Authentication:**

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Click **Save**

**Firestore Database:**

1. Go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll update rules later)
4. Select your preferred location
5. Click **Done**

**Storage:**

1. Go to **Storage**
2. Click **"Get started"**
3. Choose **"Start in test mode"**
4. Select same location as Firestore
5. Click **Done**

**Cloud Functions:**

1. Go to **Functions**
2. Click **"Get started"** (this will be set up when we deploy)

**Cloud Messaging (for notifications):**

1. Go to **Cloud Messaging**
2. No setup needed initially

### 1.3 Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click **"Add app"** → **Web** (</>)
4. Register app name: `smart-inventory-frontend`
5. **Copy the firebaseConfig object** - you'll need this!

## 🛠️ Step 2: Setup Backend (Firebase Cloud Functions)

### 2.1 Initialize Firebase in Backend Directory

```bash
# Navigate to your project root
cd "D:\MAD mini\smartinventory"

# Navigate to backend directory
cd backend

# Login to Firebase (if not already logged in)
firebase login

# Initialize Firebase project
firebase init
```

When prompted, select:

- ✅ **Functions: Configure a Cloud Functions directory**
- ✅ **Firestore: Configure security rules and indexes files**
- ✅ **Storage: Configure a security rules file for Cloud Storage**

Then:

- **Select existing project** → Choose your Firebase project
- **Language**: TypeScript
- **Use ESLint**: Yes
- **Install dependencies**: Yes
- **Firestore rules file**: Accept default (`firestore.rules`)
- **Firestore indexes file**: Accept default (`firestore.indexes.json`)
- **Storage rules file**: Accept default (`storage.rules`)

### 2.2 Install Backend Dependencies

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install
```

### 2.3 Configure Environment Variables

```bash
# Copy environment template
cp env.example .env

# Edit .env file with your configuration
# You can leave GOOGLE_VISION_API_KEY empty for now (mock OCR will be used)
```

Edit `functions/.env`:

```env
# Firebase Configuration
GOOGLE_CLOUD_PROJECT=your-firebase-project-id

# Google Cloud Vision API (for OCR) - OPTIONAL
# Leave empty to use mock OCR for development
GOOGLE_VISION_API_KEY=

# Firebase Cloud Messaging (for push notifications)
FCM_SERVER_KEY=your-fcm-server-key
```

### 2.4 Setup Service Account (Optional for local development)

```bash
# Copy service account template
cp config/service-account.json.example config/service-account.json
```

For production, you'll need to:

1. Go to Firebase Console → **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Save the JSON file as `config/service-account.json`

## 🎨 Step 3: Setup Frontend

### 3.1 Install Frontend Dependencies

```bash
# Navigate back to project root
cd "D:\MAD mini\smartinventory"

# Install Firebase SDK
npm install firebase

# Install all dependencies
npm install
```

### 3.2 Configure Firebase in Frontend

Edit `src/config/firebase.js` with your Firebase configuration:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Replace with YOUR actual Firebase configuration
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
```

## 🚀 Step 4: Deploy Backend

### 4.1 Build and Deploy Functions

```bash
# Navigate to backend directory
cd backend

# Build TypeScript functions
cd functions && npm run build && cd ..

# Deploy everything (functions, firestore rules, storage rules)
firebase deploy

# Or deploy only functions
firebase deploy --only functions
```

### 4.2 Get Functions URL

After deployment, you'll see output like:

```
✔ Deploy complete!

Functions:
  api(us-central1): https://us-central1-your-project-id.cloudfunctions.net/api
```

**Copy this URL!** You'll need it for the frontend.

### 4.3 Update Frontend API URL

Edit `src/services/api.js` and replace the API_BASE_URL:

```javascript
const API_BASE_URL =
  "https://us-central1-your-project-id.cloudfunctions.net/api";
```

## 🏃‍♂️ Step 5: Start the Application

### 5.1 Start Frontend

```bash
# Navigate to project root
cd "D:\MAD mini\smartinventory"

# Start Expo development server
npm start
# or
expo start
```

### 5.2 Run on Device/Emulator

- **For Android**: Press `a` in terminal or scan QR code with Expo Go app
- **For iOS**: Press `i` in terminal or scan QR code with Expo Go app
- **For Web**: Press `w` in terminal

## 🧪 Step 6: Test the Application

### 6.1 Test Authentication

1. Open the app
2. Try registering a new user
3. Try logging in with the registered user
4. Check Firebase Console → **Authentication** to see the user

### 6.2 Test Inventory Management

1. Add a new inventory item
2. Edit an existing item
3. Delete an item
4. Check Firebase Console → **Firestore Database** to see the data

### 6.3 Test OCR (Mock Mode)

1. Go to OCR Scan screen
2. Take a photo or select an image
3. Process the image (will use mock OCR data)
4. Add extracted items to inventory

## 🔧 Development Commands

### Backend Commands

```bash
cd backend

# Build functions
cd functions && npm run build && cd ..

# Run local emulators
firebase emulators:start

# Deploy functions only
firebase deploy --only functions

# Deploy rules only
firebase deploy --only firestore:rules,storage

# View function logs
firebase functions:log
```

### Frontend Commands

```bash
# Start development server
npm start

# Start for specific platform
npm run android
npm run ios
npm run web

# Clear cache
expo start --clear
```

## 🐛 Troubleshooting

### Common Issues

**1. Firebase CLI not found**

```bash
npm install -g firebase-tools
```

**2. Expo CLI not found**

```bash
npm install -g @expo/cli
```

**3. Functions deployment fails**

- Check that you're in the correct directory
- Ensure `functions/package.json` exists
- Run `npm install` in the functions directory

**4. Frontend can't connect to backend**

- Verify the API_BASE_URL in `src/services/api.js`
- Check that functions are deployed successfully
- Ensure Firebase config is correct in `src/config/firebase.js`

**5. Authentication not working**

- Verify Email/Password is enabled in Firebase Console
- Check Firebase config in frontend
- Ensure you're using the correct project ID

### Enable Debug Mode

Add this to `src/config/firebase.js` for debugging:

```javascript
// Enable debug mode in development
if (__DEV__) {
  // Uncomment these lines to use local emulators
  // connectAuthEmulator(auth, "http://localhost:9099");
  // connectFirestoreEmulator(db, "localhost", 8080);
  // connectStorageEmulator(storage, "localhost", 9199);
}
```

## 🎉 You're All Set!

Your Smart Inventory App should now be running with:

- ✅ Firebase Authentication
- ✅ Real-time Firestore database
- ✅ Cloud Storage for images
- ✅ OCR processing (mock mode)
- ✅ Push notifications (when configured)

## 📝 Next Steps

1. **Enable Google Vision API** for real OCR (optional)
2. **Configure push notifications** with FCM
3. **Customize Firestore security rules** for production
4. **Add more features** as needed

Happy coding! 🚀
