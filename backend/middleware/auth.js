const admin = require("firebase-admin");
const User = require("../models/User");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Find or create user in our database
    let user = await User.findOne({ firebaseUid });

    if (!user) {
      // Create user if doesn't exist
      const firebaseUser = await admin.auth().getUser(firebaseUid);
      user = new User({
        firebaseUid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
        profilePicture: firebaseUser.photoURL || null,
        lastLogin: new Date(),
      });
      await user.save();
    } else {
      // Update last login
      await user.updateLastLogin();
    }

    // Add user info to request
    req.user = user;
    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Token expired" });
    }

    if (error.code === "auth/id-token-revoked") {
      return res.status(401).json({ error: "Token revoked" });
    }

    return res.status(401).json({ error: "Invalid token" });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const firebaseUid = decodedToken.uid;

      const user = await User.findOne({ firebaseUid });
      if (user) {
        req.user = user;
        req.firebaseUser = decodedToken;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  admin,
};
