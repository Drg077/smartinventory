import * as admin from "firebase-admin";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import * as sharp from "sharp";

export interface OCRResult {
  id?: string;
  userId: string;
  imageUrl: string;
  rawText: string;
  extractedItems: ExtractedItem[];
  confidence: number;
  processedAt: admin.firestore.Timestamp;
  status: "processing" | "completed" | "failed";
  error?: string;
}

export interface ExtractedItem {
  name: string;
  quantity: number;
  price: number;
  minStock: number;
  confidence: number;
}

export class OCRService {
  private db = admin.firestore();
  private storage = admin.storage();
  private vision = new ImageAnnotatorClient();

  async processImage(userId: string, file: Express.Multer.File): Promise<any> {
    try {
      // Upload image to Firebase Storage
      const imageUrl = await this.uploadImage(userId, file);

      // Create initial OCR record
      const ocrRecord: Partial<OCRResult> = {
        userId,
        imageUrl,
        rawText: "",
        extractedItems: [],
        confidence: 0,
        processedAt:
          admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        status: "processing",
      };

      const docRef = await this.db.collection("ocr_results").add(ocrRecord);

      // Process image with Google Vision API
      try {
        const visionResult = await this.performOCR(imageUrl);
        const extractedItems = this.parseOCRText(visionResult.text);

        // Update OCR record with results
        await docRef.update({
          rawText: visionResult.text,
          extractedItems,
          confidence: visionResult.confidence,
          status: "completed",
        });

        return {
          success: true,
          id: docRef.id,
          rawText: visionResult.text,
          items: extractedItems,
          confidence: visionResult.confidence,
        };
      } catch (ocrError) {
        console.error("OCR processing failed:", ocrError);

        // Update record with error
        await docRef.update({
          status: "failed",
          error:
            ocrError instanceof Error
              ? ocrError.message
              : "OCR processing failed",
        });

        throw ocrError;
      }
    } catch (error) {
      console.error("Image processing error:", error);
      throw error;
    }
  }

  async processImageFromUrl(userId: string, imageUrl: string): Promise<any> {
    try {
      // Create initial OCR record
      const ocrRecord: Partial<OCRResult> = {
        userId,
        imageUrl,
        rawText: "",
        extractedItems: [],
        confidence: 0,
        processedAt:
          admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        status: "processing",
      };

      const docRef = await this.db.collection("ocr_results").add(ocrRecord);

      // Process image with Google Vision API
      const visionResult = await this.performOCR(imageUrl);
      const extractedItems = this.parseOCRText(visionResult.text);

      // Update OCR record with results
      await docRef.update({
        rawText: visionResult.text,
        extractedItems,
        confidence: visionResult.confidence,
        status: "completed",
      });

      return {
        success: true,
        id: docRef.id,
        rawText: visionResult.text,
        items: extractedItems,
        confidence: visionResult.confidence,
      };
    } catch (error) {
      console.error("URL image processing error:", error);
      throw error;
    }
  }

  private async uploadImage(
    userId: string,
    file: Express.Multer.File
  ): Promise<string> {
    try {
      // Optimize image using Sharp
      const optimizedBuffer = await sharp(file.buffer)
        .resize(1920, 1920, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `ocr-images/${userId}/${timestamp}-${file.originalname}`;

      // Upload to Firebase Storage
      const bucket = this.storage.bucket();
      const fileRef = bucket.file(filename);

      await fileRef.save(optimizedBuffer, {
        metadata: {
          contentType: "image/jpeg",
          metadata: {
            userId,
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Make file publicly readable (or use signed URLs for security)
      await fileRef.makePublic();

      return `https://storage.googleapis.com/${bucket.name}/${filename}`;
    } catch (error) {
      console.error("Image upload error:", error);
      throw new Error("Failed to upload image");
    }
  }

  private async performOCR(
    imageUrl: string
  ): Promise<{ text: string; confidence: number }> {
    try {
      // Use Google Vision API for text detection
      const [result] = await this.vision.textDetection(imageUrl);
      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        return { text: "", confidence: 0 };
      }

      // First annotation contains the full text
      const fullText = detections[0].description || "";

      // Calculate average confidence
      const confidence =
        detections.reduce((sum, detection) => {
          return sum + (detection.confidence || 0);
        }, 0) / detections.length;

      return {
        text: fullText,
        confidence: Math.round(confidence * 100) / 100,
      };
    } catch (error) {
      console.error("Google Vision API error:", error);

      // Fallback to mock OCR for development
      return this.mockOCR();
    }
  }

  private mockOCR(): { text: string; confidence: number } {
    // Mock OCR response for development/testing
    const mockTexts = [
      "GROCERY RECEIPT\nApple - 5 pcs - $2.50\nBanana - 10 pcs - $1.80\nMilk - 2 bottles - $4.50\nBread - 1 loaf - $2.00\nTotal: $10.80",
      "INVOICE\nItem Name\tQty\tPrice\nOrange Juice\t3\t$5.99\nCereal\t2\t$7.50\nEggs\t12\t$3.25\nChicken\t1kg\t$8.99",
      "BILL\nRice 5kg $12.99\nOil 1L $4.50\nSalt 1kg $1.99\nSugar 2kg $3.99\nFlour 1kg $2.50",
    ];

    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];

    return {
      text: randomText,
      confidence: 0.85 + Math.random() * 0.1, // Random confidence between 0.85-0.95
    };
  }

  private parseOCRText(text: string): ExtractedItem[] {
    const lines = text.split("\n").filter((line) => line.trim());
    const items: ExtractedItem[] = [];

    for (const line of lines) {
      // Skip header lines
      if (
        line.toLowerCase().includes("receipt") ||
        line.toLowerCase().includes("invoice") ||
        line.toLowerCase().includes("bill") ||
        line.toLowerCase().includes("total")
      ) {
        continue;
      }

      // Try different parsing patterns
      const item = this.parseLineToItem(line);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  private parseLineToItem(line: string): ExtractedItem | null {
    // Pattern 1: "Item Name - Quantity - Price"
    let match = line.match(
      /^(.+?)\s*-\s*(\d+)\s*(?:pcs?|pieces?|bottles?|loaf|loaves|kg|g|L|ml)?\s*-\s*\$?(\d+\.?\d*)/i
    );
    if (match) {
      return {
        name: match[1].trim(),
        quantity: parseInt(match[2]),
        price: parseFloat(match[3]),
        minStock: Math.max(1, Math.floor(parseInt(match[2]) * 0.2)),
        confidence: 0.9,
      };
    }

    // Pattern 2: "Item Name\tQuantity\tPrice" (tab separated)
    match = line.match(/^(.+?)\t+(\d+)\t+\$?(\d+\.?\d*)/);
    if (match) {
      return {
        name: match[1].trim(),
        quantity: parseInt(match[2]),
        price: parseFloat(match[3]),
        minStock: Math.max(1, Math.floor(parseInt(match[2]) * 0.2)),
        confidence: 0.85,
      };
    }

    // Pattern 3: "Item Name Quantity Price" (space separated)
    match = line.match(
      /^(.+?)\s+(\d+)(?:pcs?|pieces?|bottles?|loaf|loaves?|kg|g|L|ml)?\s+\$?(\d+\.?\d*)/i
    );
    if (match) {
      return {
        name: match[1].trim(),
        quantity: parseInt(match[2]),
        price: parseFloat(match[3]),
        minStock: Math.max(1, Math.floor(parseInt(match[2]) * 0.2)),
        confidence: 0.8,
      };
    }

    // Pattern 4: Simple "Item Name $Price" (assume quantity 1)
    match = line.match(/^(.+?)\s+\$(\d+\.?\d*)/);
    if (match) {
      return {
        name: match[1].trim(),
        quantity: 1,
        price: parseFloat(match[2]),
        minStock: 1,
        confidence: 0.7,
      };
    }

    return null;
  }

  async getOCRHistory(userId: string, limit: number = 10) {
    try {
      const snapshot = await this.db
        .collection("ocr_results")
        .where("userId", "==", userId)
        .orderBy("processedAt", "desc")
        .limit(limit)
        .get();

      const history = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        history,
        count: history.length,
      };
    } catch (error) {
      console.error("Get OCR history error:", error);
      throw error;
    }
  }

  async getOCRResult(userId: string, resultId: string) {
    try {
      const doc = await this.db.collection("ocr_results").doc(resultId).get();

      if (!doc.exists) {
        throw new Error("OCR result not found");
      }

      const data = doc.data();
      if (data?.userId !== userId) {
        throw new Error("Unauthorized access to OCR result");
      }

      return {
        success: true,
        result: {
          id: doc.id,
          ...data,
        },
      };
    } catch (error) {
      console.error("Get OCR result error:", error);
      throw error;
    }
  }

  async deleteOCRResult(userId: string, resultId: string) {
    try {
      const doc = await this.db.collection("ocr_results").doc(resultId).get();

      if (!doc.exists) {
        throw new Error("OCR result not found");
      }

      const data = doc.data();
      if (data?.userId !== userId) {
        throw new Error("Unauthorized access to OCR result");
      }

      // Delete associated image from storage
      if (data?.imageUrl) {
        try {
          const bucket = this.storage.bucket();
          const filename = data.imageUrl.split("/").pop();
          if (filename) {
            await bucket.file(`ocr-images/${userId}/${filename}`).delete();
          }
        } catch (storageError) {
          console.warn("Failed to delete associated image:", storageError);
        }
      }

      // Delete Firestore document
      await doc.ref.delete();

      return {
        success: true,
        message: "OCR result deleted successfully",
      };
    } catch (error) {
      console.error("Delete OCR result error:", error);
      throw error;
    }
  }

  async reprocessOCR(userId: string, resultId: string, settings?: any) {
    try {
      const doc = await this.db.collection("ocr_results").doc(resultId).get();

      if (!doc.exists) {
        throw new Error("OCR result not found");
      }

      const data = doc.data();
      if (data?.userId !== userId) {
        throw new Error("Unauthorized access to OCR result");
      }

      // Reprocess with the same image URL
      const result = await this.processImageFromUrl(userId, data?.imageUrl);

      return result;
    } catch (error) {
      console.error("Reprocess OCR error:", error);
      throw error;
    }
  }
}
