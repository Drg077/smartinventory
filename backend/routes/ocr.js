const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { authenticateToken } = require("../middleware/auth");
const ocrService = require("../utils/ocr");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "ocr-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|bmp|tiff|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Process OCR image
router.post(
  "/process",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    let filePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      filePath = req.file.path;
      console.log("📷 Processing OCR for file:", filePath);

      // Process the image with OCR
      const result = await ocrService.processImage(filePath);

      res.json(result);
    } catch (error) {
      console.error("OCR processing error:", error);

      let errorMessage = "OCR processing failed";
      let statusCode = 500;

      if (error.message.includes("file format")) {
        errorMessage = "Unsupported image format";
        statusCode = 400;
      } else if (error.message.includes("file size")) {
        errorMessage = "Image file too large";
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    } finally {
      // Clean up uploaded file
      if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch (cleanupError) {
          console.warn("Failed to cleanup uploaded file:", cleanupError);
        }
      }
    }
  }
);

// Process OCR from base64 image
router.post("/process-base64", authenticateToken, async (req, res) => {
  let tempFilePath = null;

  try {
    const { image, filename = "image.jpg" } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    // Extract base64 data (remove data:image/...;base64, prefix if present)
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "");

    // Create temporary file
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(filename) || ".jpg";
    tempFilePath = path.join("uploads", `ocr-base64-${uniqueSuffix}${ext}`);

    // Write base64 data to file
    await fs.writeFile(tempFilePath, base64Data, "base64");

    console.log("📷 Processing OCR for base64 image:", tempFilePath);

    // Process the image with OCR
    const result = await ocrService.processImage(tempFilePath);

    res.json(result);
  } catch (error) {
    console.error("OCR base64 processing error:", error);

    let errorMessage = "OCR processing failed";
    let statusCode = 500;

    if (error.message.includes("Invalid base64")) {
      errorMessage = "Invalid image data";
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn("Failed to cleanup temporary file:", cleanupError);
      }
    }
  }
});

// Get OCR processing status/info
router.get("/info", authenticateToken, (req, res) => {
  res.json({
    success: true,
    info: {
      engine: "Tesseract.js",
      supportedFormats: ["jpeg", "jpg", "png", "gif", "bmp", "tiff", "webp"],
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
      language: process.env.OCR_LANGUAGE || "eng",
      confidenceThreshold: parseInt(process.env.OCR_CONFIDENCE_THRESHOLD) || 60,
      features: [
        "Text extraction from receipts and bills",
        "Automatic item parsing",
        "Price and quantity detection",
        "Category suggestion",
        "Multiple language support",
      ],
    },
  });
});

// Test OCR with sample data (development only)
router.get("/test", authenticateToken, async (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    // Return mock OCR result for testing
    const result = await ocrService.getMockOCRResult();
    res.json(result);
  } catch (error) {
    console.error("OCR test error:", error);
    res.status(500).json({ error: "Test failed" });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large" });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: "Unexpected file field" });
    }
  }

  if (error.message === "Only image files are allowed!") {
    return res.status(400).json({ error: "Only image files are allowed" });
  }

  next(error);
});

module.exports = router;
