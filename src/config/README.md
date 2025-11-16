# Firebase Configuration Setup (Authentication Only)

## 🔧 Setup Instructions

### 1. Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **General**
4. Scroll down to **Your apps** section
5. Click **Add app** → **Web** (</>)
6. Register your app
7. Copy the configuration object

### 2. Update Firebase Config

Replace the placeholder values in `src/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id",
};
```

### 3. Update API Base URL

In `src/services/api.js`, replace:

```javascript
const API_BASE_URL = "http://localhost:5000/api";
```

With your actual Node.js backend URL (e.g., `http://your-server.com:5000/api` for production).

### 4. Enable Firebase Services

In Firebase Console, enable **ONLY**:

- ✅ **Authentication** → Email/Password

**Note**: We're using Firebase only for authentication. All data (inventory, notifications) is stored in MongoDB via the Node.js backend.

## 🚀 Testing

After setup:

1. Ensure Firebase SDK is installed: `npm install`
2. Start your Node.js backend: `cd backend && npm run dev`
3. Start your app: `npm start`
4. Test login/register functionality
5. Verify data is stored in MongoDB (not Firestore)

## 🔐 Security

- Never commit your actual Firebase config to public repositories
- Firebase is used only for authentication (free tier)
- All data is stored securely in your MongoDB database
- Backend handles authentication verification via Firebase Admin SDK

## 🏗️ Architecture

```
Frontend (React Native)
├── Firebase Auth (login/register)
└── HTTP API calls to Node.js backend

Backend (Node.js + Express)
├── Firebase Admin SDK (verify auth tokens)
├── MongoDB (data storage)
└── Tesseract.js (OCR processing)
```
