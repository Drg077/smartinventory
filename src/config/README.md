# Firebase Configuration Setup

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
const API_BASE_URL =
  "https://your-region-your-project-id.cloudfunctions.net/api";
```

With your actual Cloud Functions URL (you'll get this after deploying the backend).

### 4. Enable Firebase Services

In Firebase Console, enable:

- ✅ **Authentication** → Email/Password
- ✅ **Firestore Database**
- ✅ **Storage**
- ✅ **Functions**
- ✅ **Cloud Messaging** (for push notifications)

## 🚀 Testing

After setup:

1. Run `npm install` to install Firebase SDK
2. Start your app: `npm start`
3. Test login/register functionality
4. Verify data syncs with Firestore

## 🔐 Security

- Never commit your actual Firebase config to public repositories
- Consider using environment variables for sensitive data
- Review Firestore security rules in the backend
