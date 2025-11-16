import { Router } from "express";
import * as multer from "multer";
import { verifyToken } from "../auth/authRoutes";
import { OCRService } from "./ocrService";

const router = Router();
const ocrService = new OCRService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Apply authentication middleware to all routes
router.use(verifyToken);

// Upload and process image for OCR
router.post("/process", upload.single("image"), async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: "No image file provided",
      });
    }

    console.log(
      `Processing OCR for user: ${userId}, file: ${file.originalname}`
    );

    const result = await ocrService.processImage(userId, file);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("OCR processing error:", error);

    if (error.message === "Only image files are allowed") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: "Failed to process image",
    });
  }
});

// Process image from URL
router.post("/process-url", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        error: "Image URL is required",
      });
    }

    console.log(`Processing OCR from URL for user: ${userId}`);

    const result = await ocrService.processImageFromUrl(userId, imageUrl);
    res.status(200).json(result);
  } catch (error) {
    console.error("OCR URL processing error:", error);
    res.status(500).json({
      error: "Failed to process image from URL",
    });
  }
});

// Get OCR processing history
router.get("/history", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit as string) || 10;

    const history = await ocrService.getOCRHistory(userId, limit);
    res.status(200).json(history);
  } catch (error) {
    console.error("Get OCR history error:", error);
    res.status(500).json({
      error: "Failed to fetch OCR history",
    });
  }
});

// Get specific OCR result
router.get("/result/:resultId", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { resultId } = req.params;

    const result = await ocrService.getOCRResult(userId, resultId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Get OCR result error:", error);
    res.status(404).json({
      error: "OCR result not found",
    });
  }
});

// Delete OCR result and associated image
router.delete("/result/:resultId", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { resultId } = req.params;

    await ocrService.deleteOCRResult(userId, resultId);
    res.status(200).json({
      success: true,
      message: "OCR result deleted successfully",
    });
  } catch (error) {
    console.error("Delete OCR result error:", error);
    res.status(500).json({
      error: "Failed to delete OCR result",
    });
  }
});

// Reprocess OCR result with different settings
router.post("/reprocess/:resultId", async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const { resultId } = req.params;
    const { settings } = req.body;

    const result = await ocrService.reprocessOCR(userId, resultId, settings);
    res.status(200).json(result);
  } catch (error) {
    console.error("Reprocess OCR error:", error);
    res.status(500).json({
      error: "Failed to reprocess OCR",
    });
  }
});

export { router as ocrRoutes };
