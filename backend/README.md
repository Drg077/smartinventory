# Smart Inventory Backend

Simple Firebase-only backend for the Smart Inventory mobile app.

## 🚀 Quick Start

### 1. Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Setup project
./scripts/setup.sh

# Login and initialize
firebase login
firebase init
```

### 2. Configure

- Edit `functions/.env` with your API keys
- Replace `config/service-account.json` with your service account key
- Update `config/firebase-config.js` with your project settings

### 3. Deploy

```bash
./scripts/deploy.sh
```

## 🔥 Firebase Services

- **Authentication** - Email/password login
- **Firestore** - Real-time database
- **Storage** - Image storage for OCR
- **Functions** - API endpoints and triggers
- **Messaging** - Push notifications

## 📱 API Endpoints

Base URL: `https://your-region-your-project-id.cloudfunctions.net/api`

### Auth

- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get profile

### Inventory

- `GET /inventory` - Get all items
- `POST /inventory` - Add item
- `PUT /inventory/:id` - Update item
- `DELETE /inventory/:id` - Delete item

### OCR

- `POST /ocr/process` - Process image
- `GET /ocr/history` - Get history

### Notifications

- `POST /notifications/register-token` - Register FCM token
- `GET /notifications` - Get notifications

## 🛠️ Development

```bash
# Start emulators
firebase emulators:start

# View logs
firebase functions:log

# Deploy functions only
./scripts/deploy.sh functions
```

## 📊 Database Schema

```
users/{userId}
inventory/{userId}/items/{itemId}
ocr_results/{resultId}
notifications/{userId}/messages/{messageId}
```

## 🔐 Security

- Firestore rules ensure users only access their own data
- Storage rules restrict uploads to authenticated users
- All API endpoints require authentication
