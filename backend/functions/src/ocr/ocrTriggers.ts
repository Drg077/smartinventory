import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { OCRService } from "./ocrService";

const ocrService = new OCRService();

// Trigger when an image is uploaded to the OCR images folder
export const onImageUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    try {
      const filePath = object.name;
      const contentType = object.contentType;

      // Only process images in the ocr-images folder
      if (
        !filePath?.startsWith("ocr-images/") ||
        !contentType?.startsWith("image/")
      ) {
        console.log("Skipping non-OCR image:", filePath);
        return;
      }

      // Extract user ID from path: ocr-images/{userId}/{filename}
      const pathParts = filePath.split("/");
      if (pathParts.length < 3) {
        console.log("Invalid OCR image path:", filePath);
        return;
      }

      const userId = pathParts[1];
      const filename = pathParts[2];

      console.log(
        `Processing uploaded OCR image: ${filename} for user: ${userId}`
      );

      // Get the public URL of the uploaded image
      const bucket = admin.storage().bucket(object.bucket);
      const file = bucket.file(filePath);

      // Make file publicly readable
      await file.makePublic();

      const imageUrl = `https://storage.googleapis.com/${object.bucket}/${filePath}`;

      // Process the image with OCR
      try {
        const result = await ocrService.processImageFromUrl(userId, imageUrl);

        console.log(`OCR processing completed for ${filename}:`, {
          itemsFound: result.items?.length || 0,
          confidence: result.confidence,
        });

        // Optionally send notification to user about completion
        await admin
          .firestore()
          .collection("notifications")
          .doc(userId)
          .collection("messages")
          .add({
            type: "ocr_completed",
            title: "OCR Processing Complete",
            body: `Found ${
              result.items?.length || 0
            } items in your uploaded image`,
            data: {
              ocrResultId: result.id,
              itemsCount: result.items?.length || 0,
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false,
          });
      } catch (ocrError) {
        console.error("OCR processing failed for uploaded image:", ocrError);

        // Log the error and notify user
        await admin
          .firestore()
          .collection("notifications")
          .doc(userId)
          .collection("messages")
          .add({
            type: "ocr_failed",
            title: "OCR Processing Failed",
            body: "Failed to process your uploaded image. Please try again.",
            data: {
              error:
                ocrError instanceof Error ? ocrError.message : "Unknown error",
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false,
          });
      }
    } catch (error) {
      console.error("Error in onImageUpload trigger:", error);
    }
  });

// Trigger when an OCR result is created
export const onOCRResultCreate = functions.firestore
  .document("ocr_results/{resultId}")
  .onCreate(async (snapshot, context) => {
    try {
      const { resultId } = context.params;
      const ocrData = snapshot.data();

      console.log(
        `New OCR result created: ${resultId} for user: ${ocrData.userId}`
      );

      // Log OCR activity
      await admin
        .firestore()
        .collection("activity_logs")
        .doc(ocrData.userId)
        .collection("logs")
        .add({
          type: "ocr_processed",
          ocrResultId: resultId,
          itemsExtracted: ocrData.extractedItems?.length || 0,
          confidence: ocrData.confidence,
          status: ocrData.status,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      // If OCR completed successfully and found items, create a notification
      if (
        ocrData.status === "completed" &&
        ocrData.extractedItems?.length > 0
      ) {
        await admin
          .firestore()
          .collection("notifications")
          .doc(ocrData.userId)
          .collection("messages")
          .add({
            type: "ocr_items_ready",
            title: "Items Ready to Add",
            body: `OCR found ${ocrData.extractedItems.length} items ready to add to your inventory`,
            data: {
              ocrResultId: resultId,
              itemsCount: ocrData.extractedItems.length,
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false,
          });
      }
    } catch (error) {
      console.error("Error in onOCRResultCreate trigger:", error);
    }
  });

// Trigger when an OCR result is updated
export const onOCRResultUpdate = functions.firestore
  .document("ocr_results/{resultId}")
  .onUpdate(async (change, context) => {
    try {
      const { resultId } = context.params;
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // Check if status changed from processing to completed/failed
      if (beforeData.status !== afterData.status) {
        console.log(
          `OCR result status changed: ${resultId} - ${beforeData.status} -> ${afterData.status}`
        );

        // Log status change
        await admin
          .firestore()
          .collection("activity_logs")
          .doc(afterData.userId)
          .collection("logs")
          .add({
            type: "ocr_status_changed",
            ocrResultId: resultId,
            previousStatus: beforeData.status,
            newStatus: afterData.status,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });

        // Handle failed OCR
        if (afterData.status === "failed") {
          await admin
            .firestore()
            .collection("notifications")
            .doc(afterData.userId)
            .collection("messages")
            .add({
              type: "ocr_failed",
              title: "OCR Processing Failed",
              body:
                afterData.error ||
                "Failed to process your image. Please try again.",
              data: {
                ocrResultId: resultId,
                error: afterData.error,
              },
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              read: false,
            });
        }
      }
    } catch (error) {
      console.error("Error in onOCRResultUpdate trigger:", error);
    }
  });
