import * as admin from "firebase-admin";

export class AuthService {
  private db = admin.firestore();
  private auth = admin.auth();

  async registerUser(name: string, email: string, password: string) {
    try {
      // Create user in Firebase Auth
      const userRecord = await this.auth.createUser({
        email,
        password,
        displayName: name,
      });

      // Create user profile in Firestore
      const userProfile = {
        uid: userRecord.uid,
        name,
        email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      };

      await this.db.collection("users").doc(userRecord.uid).set(userProfile);

      // Generate custom token for immediate login
      const customToken = await this.auth.createCustomToken(userRecord.uid);

      return {
        success: true,
        user: {
          uid: userRecord.uid,
          name,
          email,
        },
        customToken,
      };
    } catch (error) {
      console.error("User registration error:", error);
      throw error;
    }
  }

  async loginUser(email: string) {
    try {
      // Get user by email
      const userRecord = await this.auth.getUserByEmail(email);

      // Update last login
      await this.db.collection("users").doc(userRecord.uid).update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Get user profile
      const userDoc = await this.db
        .collection("users")
        .doc(userRecord.uid)
        .get();
      const userData = userDoc.data();

      return {
        success: true,
        user: {
          uid: userRecord.uid,
          name: userData?.name || userRecord.displayName,
          email: userRecord.email,
        },
      };
    } catch (error) {
      console.error("User login error:", error);
      throw error;
    }
  }

  async getUserProfile(userId: string) {
    try {
      const userDoc = await this.db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        throw new Error("User profile not found");
      }

      const userData = userDoc.data();
      return {
        success: true,
        user: {
          uid: userId,
          name: userData?.name,
          email: userData?.email,
          createdAt: userData?.createdAt,
          lastLogin: userData?.lastLogin,
        },
      };
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: any) {
    try {
      const allowedUpdates = ["name"];
      const filteredUpdates: any = {};

      // Filter only allowed updates
      allowedUpdates.forEach((field) => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      if (Object.keys(filteredUpdates).length === 0) {
        throw new Error("No valid updates provided");
      }

      filteredUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      // Update Firestore document
      await this.db.collection("users").doc(userId).update(filteredUpdates);

      // Update Firebase Auth if name changed
      if (filteredUpdates.name) {
        await this.auth.updateUser(userId, {
          displayName: filteredUpdates.name,
        });
      }

      return {
        success: true,
        message: "Profile updated successfully",
      };
    } catch (error) {
      console.error("Update user profile error:", error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      // Delete user data from Firestore
      const batch = this.db.batch();

      // Delete user profile
      batch.delete(this.db.collection("users").doc(userId));

      // Delete user's inventory items
      const inventorySnapshot = await this.db
        .collection("inventory")
        .doc(userId)
        .collection("items")
        .get();

      inventorySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete inventory collection document
      batch.delete(this.db.collection("inventory").doc(userId));

      await batch.commit();

      // Delete user from Firebase Auth
      await this.auth.deleteUser(userId);

      return {
        success: true,
        message: "User deleted successfully",
      };
    } catch (error) {
      console.error("Delete user error:", error);
      throw error;
    }
  }
}
