import { Router } from "express";
import * as admin from "firebase-admin";
import { AuthService } from "./authService";

const router = Router();
const authService = new AuthService();

// Middleware to verify Firebase ID token
export const verifyToken = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const result = await authService.registerUser(name, email, password);
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({
        error: "User with this email already exists",
      });
    }

    res.status(500).json({
      error: "Registration failed. Please try again.",
    });
  }
});

// Login user (Firebase handles this on client side, but we can create custom tokens)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Note: Firebase Auth handles login on client side
    // This endpoint is mainly for custom token generation if needed
    const result = await authService.loginUser(email);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(401).json({
      error: "Invalid credentials",
    });
  }
});

// Get user profile
router.get("/profile", verifyToken, async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const profile = await authService.getUserProfile(userId);
    res.status(200).json(profile);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch profile",
    });
  }
});

// Update user profile
router.put("/profile", verifyToken, async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const updates = req.body;

    const result = await authService.updateUserProfile(userId, updates);
    res.status(200).json(result);
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      error: "Failed to update profile",
    });
  }
});

// Delete user account
router.delete("/account", verifyToken, async (req: any, res) => {
  try {
    const userId = req.user.uid;
    await authService.deleteUser(userId);
    res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({
      error: "Failed to delete account",
    });
  }
});

export { router as authRoutes };
