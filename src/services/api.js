import { auth } from "../config/firebase";

// Your Firebase Cloud Functions base URL
// Replace with your actual functions URL
const API_BASE_URL =
  "https://your-region-your-project-id.cloudfunctions.net/api";

class ApiService {
  async getAuthToken() {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    throw new Error("User not authenticated");
  }

  async request(endpoint, options = {}) {
    try {
      const token = await this.getAuthToken();

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "API request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  // Inventory API methods
  async getInventory() {
    return this.request("/inventory");
  }

  async addInventoryItem(item) {
    return this.request("/inventory", {
      method: "POST",
      body: JSON.stringify(item),
    });
  }

  async updateInventoryItem(id, updates) {
    return this.request(`/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteInventoryItem(id) {
    return this.request(`/inventory/${id}`, {
      method: "DELETE",
    });
  }

  async addMultipleItems(items) {
    return this.request("/inventory/batch", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  }

  async getInventoryStats() {
    return this.request("/inventory/stats/summary");
  }

  // OCR API methods
  async processOCRImage(imageUri) {
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      type: "image/jpeg",
      name: "receipt.jpg",
    });

    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/ocr/process`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "OCR processing failed");
    }

    return await response.json();
  }

  // Notification API methods
  async registerFCMToken(fcmToken, platform) {
    return this.request("/notifications/register-token", {
      method: "POST",
      body: JSON.stringify({ fcmToken, platform }),
    });
  }

  async getNotifications(limit = 20, unreadOnly = false) {
    const params = new URLSearchParams({ limit, unreadOnly });
    return this.request(`/notifications?${params}`);
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  }
}

export default new ApiService();
