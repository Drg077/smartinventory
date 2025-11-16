# Smart Inventory App - Complete Setup Guide (Node.js + MongoDB + Firebase Auth)

## 🏗️ Architecture Overview

- **Frontend**: React Native with Expo
- **Authentication**: Firebase Auth (free tier)
- **Backend**: Node.js with Express
- **Database**: MongoDB (local or Atlas free tier)
- **OCR**: Tesseract.js (free, no API key needed)
- **File Storage**: Local file system

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- MongoDB (local installation or Atlas account)
- Firebase account (free tier)

## 🔥 Step 1: Setup Firebase (Authentication Only)

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `smart-inventory-app`
4. **Disable Google Analytics** (not needed)
5. Click **"Create project"**

### 1.2 Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Click **Save**

**Important**: We're NOT enabling Firestore, Storage, or Functions since we're using Node.js backend.

### 1.3 Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click **"Add app"** → **Web** (</>)
4. Register app name: `smart-inventory-frontend`
5. **Copy the firebaseConfig object** - you'll need this!

### 1.4 Get Firebase Admin Credentials

1. Go to **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Download the JSON file
4. Extract these values for your backend `.env`:
   - `project_id`
   - `private_key`
   - `client_email`

## 🗄️ Step 2: Setup MongoDB

### Option A: Local MongoDB

```bash
# Windows: Download from https://www.mongodb.com/try/download/community
# macOS:
brew install mongodb-community

# Ubuntu:
sudo apt install mongodb

# Start MongoDB
mongod
```

### Option B: MongoDB Atlas (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account
3. Create free cluster (M0 Sandbox)
4. Create database user
5. Whitelist IP address (0.0.0.0/0 for development)
6. Get connection string

## 🛠️ Step 3: Setup Backend

### 3.1 Navigate to Backend

```bash
cd "D:\MAD mini\smartinventory\backend"
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Configure Environment

```bash
# Copy environment template
cp env.example .env
```

Edit `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:19006

# MongoDB Configuration
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/smartinventory
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartinventory

# Firebase Admin SDK (from step 1.4)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# OCR Configuration (Tesseract.js - no API key needed)
OCR_LANGUAGE=eng
OCR_CONFIDENCE_THRESHOLD=60
```

### 3.4 Start Backend

```bash
# Development mode (auto-restart)
npm run dev

# Or production mode
npm start
```

Backend will run on `http://localhost:5000`

## 🎨 Step 4: Setup Frontend

### 4.1 Navigate to Project Root

```bash
cd "D:\MAD mini\smartinventory"
```

### 4.2 Install Dependencies

```bash
npm install
```

### 4.3 Configure Firebase

Edit `src/config/firebase.js` with your Firebase config from Step 1.3:

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

### 4.4 Update API URL (if needed)

The API URL in `src/services/api.js` is already set to `http://localhost:5000/api` for local development.

For production, update it to your deployed backend URL.

## 🚀 Step 5: Start the Application

### 5.1 Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

You should see:

```
✅ Connected to MongoDB
🚀 Server running on port 5000
📱 API available at http://localhost:5000/api
```

### 5.2 Start Frontend (Terminal 2)

```bash
cd "D:\MAD mini\smartinventory"
npm start
```

### 5.3 Run on Device/Emulator

- **Android**: Press `a` or scan QR with Expo Go
- **iOS**: Press `i` or scan QR with Expo Go
- **Web**: Press `w`

## 🧪 Step 6: Test the Application

### 6.1 Test Backend Health

```bash
curl http://localhost:5000/api/health
```

Should return:

```json
{
  "status": "OK",
  "timestamp": "2024-11-17T...",
  "uptime": 123.456
}
```

### 6.2 Test Authentication

1. Open the app
2. Register a new user
3. Login with the registered user
4. Check MongoDB for user data

### 6.3 Test Inventory

1. Add a new inventory item
2. Edit the item
3. Delete the item
4. Check MongoDB `inventoryitems` collection

### 6.4 Test OCR

1. Go to OCR Scan screen
2. Take/select a photo
3. Process image (uses Tesseract.js)
4. Add extracted items to inventory

## 📁 Project Structure

```
D:\MAD mini\smartinventory\
├── backend/                 # Node.js Express backend
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   ├── utils/              # OCR service
│   ├── uploads/            # Temporary files
│   ├── server.js           # Main server
│   └── package.json
├── src/                    # React Native frontend
│   ├── components/
│   ├── context/           # Auth & Inventory contexts
│   ├── screens/
│   ├── services/          # API service
│   ├── config/            # Firebase config
│   └── utils/
├── assets/
└── package.json
```

## 🔧 Development Commands

### Backend

```bash
cd backend

# Start development server
npm run dev

# Start production server
npm start

# View logs (if using PM2 or similar)
npm run logs
```

### Frontend

```bash
# Start Expo dev server
npm start

# Platform specific
npm run android
npm run ios
npm run web

# Clear cache
expo start --clear
```

## 🌐 API Endpoints

### Authentication

- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/stats` - User statistics

### Inventory

- `GET /api/inventory` - Get all items
- `POST /api/inventory` - Add item
- `POST /api/inventory/batch` - Add multiple items
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item
- `GET /api/inventory/stats/summary` - Statistics

### OCR

- `POST /api/ocr/process` - Process image file
- `POST /api/ocr/process-base64` - Process base64 image
- `GET /api/ocr/info` - OCR service info

### Notifications

- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/register-token` - Register FCM token

## 🔐 Security Features

- Firebase ID token authentication
- Request rate limiting
- Input validation
- File upload security
- CORS protection
- Security headers (Helmet)

## 💰 Cost Breakdown

- **Firebase Auth**: Free (up to 50,000 MAU)
- **MongoDB Atlas**: Free (512MB storage)
- **Tesseract.js**: Free (client-side OCR)
- **Node.js hosting**: Various options (Heroku, Railway, etc.)

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error**

```bash
# Check MongoDB status
mongod --version

# Start MongoDB service
# Windows: net start MongoDB
# macOS/Linux: sudo systemctl start mongod
```

**Firebase Auth Error**

- Verify project ID, private key, and client email
- Ensure private key has proper newline characters (\n)
- Check Firebase project permissions

### Frontend Issues

**API Connection Error**

- Ensure backend is running on port 5000
- Check API_BASE_URL in `src/services/api.js`
- Verify CORS settings in backend

**Authentication Not Working**

- Check Firebase config in `src/config/firebase.js`
- Ensure Email/Password is enabled in Firebase Console
- Verify network connectivity

### OCR Issues

**Slow Processing**

- Tesseract.js can be slow for large images
- Images are automatically optimized
- Consider using smaller images

**Low Accuracy**

- Ensure good image quality
- Use high contrast images
- Adjust OCR_CONFIDENCE_THRESHOLD in backend

## 🚀 Deployment

### Backend Deployment

Popular options:

- **Railway**: Easy deployment with MongoDB
- **Heroku**: Free tier available
- **DigitalOcean**: App Platform
- **AWS**: EC2 or Elastic Beanstalk

### Frontend Deployment

- **Expo**: `expo build` for app stores
- **Web**: `expo build:web` for web deployment

## 🎉 You're All Set!

Your Smart Inventory App is now running with:

- ✅ Firebase Authentication (free)
- ✅ Node.js Express backend
- ✅ MongoDB database
- ✅ Tesseract.js OCR (free)
- ✅ Real-time inventory management
- ✅ Notification system

## 📝 Next Steps

1. **Customize**: Modify UI/UX to your needs
2. **Deploy**: Deploy backend and build mobile app
3. **Enhance**: Add more features like barcode scanning
4. **Scale**: Upgrade to paid tiers when needed

Happy coding! 🚀
