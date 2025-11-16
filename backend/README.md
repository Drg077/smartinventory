# Smart Inventory Backend

Node.js Express backend with MongoDB for the Smart Inventory App.

## 🏗️ Architecture

- **Authentication**: Firebase Auth (free tier)
- **Database**: MongoDB (local or MongoDB Atlas)
- **OCR**: Tesseract.js (free, no API key needed)
- **File Storage**: Local file system
- **API**: RESTful API with Express.js

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
```

### 3. Setup MongoDB

**Option A: Local MongoDB**

```bash
# Install MongoDB locally
# Windows: Download from https://www.mongodb.com/try/download/community
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb

# Start MongoDB service
mongod
```

**Option B: MongoDB Atlas (Free)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account and cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 4. Setup Firebase Admin

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key (JSON file)
3. Extract the required fields to your `.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`

### 5. Start Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── models/           # MongoDB schemas
│   ├── User.js
│   ├── InventoryItem.js
│   └── Notification.js
├── routes/           # API routes
│   ├── auth.js
│   ├── inventory.js
│   ├── ocr.js
│   └── notifications.js
├── middleware/       # Custom middleware
│   └── auth.js
├── utils/           # Utility functions
│   └── ocr.js
├── uploads/         # Temporary file storage
├── server.js        # Main server file
└── package.json
```

## 🔧 Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:19006

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/smartinventory

# Firebase Admin SDK (for authentication verification)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# OCR Configuration (using Tesseract.js - no API key needed)
OCR_LANGUAGE=eng
OCR_CONFIDENCE_THRESHOLD=60
```

## 📡 API Endpoints

### Authentication

- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `DELETE /api/auth/account` - Delete user account
- `GET /api/auth/stats` - Get user statistics

### Inventory

- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get single item
- `POST /api/inventory` - Add new item
- `POST /api/inventory/batch` - Add multiple items
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item
- `GET /api/inventory/stats/summary` - Get inventory statistics
- `PATCH /api/inventory/:id/quantity` - Update item quantity

### OCR

- `POST /api/ocr/process` - Process image file
- `POST /api/ocr/process-base64` - Process base64 image
- `GET /api/ocr/info` - Get OCR service info
- `GET /api/ocr/test` - Test OCR (development only)

### Notifications

- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/register-token` - Register FCM token

## 🔐 Authentication

All API endpoints (except health check) require Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## 🖼️ OCR Features

- **Engine**: Tesseract.js (free, no API key required)
- **Supported formats**: JPEG, PNG, GIF, BMP, TIFF, WebP
- **Max file size**: 10MB (configurable)
- **Languages**: English (configurable)
- **Features**:
  - Text extraction from receipts/bills
  - Automatic item parsing
  - Price and quantity detection
  - Category suggestion
  - Confidence scoring

## 🗄️ Database Schema

### User

```javascript
{
  firebaseUid: String,
  email: String,
  name: String,
  profilePicture: String,
  preferences: {
    notifications: { lowStock: Boolean, expiry: Boolean, general: Boolean },
    theme: String,
    language: String
  },
  lastLogin: Date,
  isActive: Boolean
}
```

### InventoryItem

```javascript
{
  userId: String,
  name: String,
  description: String,
  category: String,
  quantity: Number,
  unit: String,
  price: Number,
  minStock: Number,
  maxStock: Number,
  location: String,
  barcode: String,
  expiryDate: Date,
  purchaseDate: Date,
  supplier: { name, contact, email },
  images: [{ url, filename, uploadedAt }],
  tags: [String],
  status: String
}
```

### Notification

```javascript
{
  userId: String,
  title: String,
  message: String,
  type: String, // 'low_stock', 'expiry', 'general', 'system'
  priority: String, // 'low', 'medium', 'high', 'urgent'
  data: Object,
  isRead: Boolean,
  readAt: Date,
  expiresAt: Date
}
```

## 🚀 Deployment

### Local Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Docker (Optional)

```bash
# Build image
docker build -t smart-inventory-backend .

# Run container
docker run -p 5000:5000 --env-file .env smart-inventory-backend
```

## 🔍 Testing

### Health Check

```bash
curl http://localhost:5000/api/health
```

### Test OCR (Development)

```bash
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/ocr/test
```

## 📊 Monitoring

- **Logs**: Console logging with Morgan
- **Health Check**: `/api/health` endpoint
- **Error Handling**: Centralized error middleware
- **Rate Limiting**: 100 requests per 15 minutes per IP

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Validation**: Mongoose schema validation
- **File Upload Security**: File type and size validation
- **Authentication**: Firebase ID token verification

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Error**

```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
# Windows: net start MongoDB
# macOS/Linux: sudo systemctl start mongod
```

**Firebase Auth Error**

- Verify Firebase project ID
- Check private key format (newlines as \n)
- Ensure service account has proper permissions

**OCR Processing Slow**

- Tesseract.js can be slow for large images
- Images are automatically optimized before processing
- Consider using smaller images for better performance

**File Upload Issues**

- Check `uploads/` directory exists and is writable
- Verify `MAX_FILE_SIZE` setting
- Ensure proper file type (images only)

## 📈 Performance Tips

1. **Database Indexing**: Indexes are automatically created for common queries
2. **Image Optimization**: Images are resized and optimized before OCR
3. **Caching**: Consider adding Redis for session/data caching
4. **File Cleanup**: Temporary files are automatically cleaned up
5. **Pagination**: All list endpoints support pagination

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details
