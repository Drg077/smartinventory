const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;

class OCRService {
  constructor() {
    this.confidenceThreshold =
      parseInt(process.env.OCR_CONFIDENCE_THRESHOLD) || 60;
    this.language = process.env.OCR_LANGUAGE || "eng";
  }

  async processImage(imagePath) {
    try {
      console.log("🔍 Starting OCR processing for:", imagePath);

      // Optimize image for better OCR results
      const optimizedImagePath = await this.optimizeImage(imagePath);

      // Perform OCR using Tesseract.js
      const result = await this.performOCR(optimizedImagePath);

      // Clean up optimized image
      if (optimizedImagePath !== imagePath) {
        await fs.unlink(optimizedImagePath).catch(() => {});
      }

      if (result.confidence < this.confidenceThreshold) {
        console.warn(`⚠️ Low OCR confidence: ${result.confidence}%`);
      }

      // Extract items from OCR text
      const extractedItems = this.extractItemsFromText(result.text);

      return {
        success: true,
        text: result.text,
        confidence: result.confidence,
        items: extractedItems,
        processingTime: result.processingTime,
      };
    } catch (error) {
      console.error("❌ OCR processing error:", error);

      // Fallback to mock data for development
      if (process.env.NODE_ENV === "development") {
        console.log("🔄 Falling back to mock OCR data");
        return this.getMockOCRResult();
      }

      throw new Error("OCR processing failed: " + error.message);
    }
  }

  async optimizeImage(imagePath) {
    try {
      const optimizedPath = imagePath.replace(
        /\.(jpg|jpeg|png)$/i,
        "_optimized.png"
      );

      await sharp(imagePath)
        .resize(1200, 1600, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .greyscale()
        .normalize()
        .sharpen()
        .png({ quality: 90 })
        .toFile(optimizedPath);

      return optimizedPath;
    } catch (error) {
      console.warn(
        "⚠️ Image optimization failed, using original:",
        error.message
      );
      return imagePath;
    }
  }

  async performOCR(imagePath) {
    const startTime = Date.now();

    const { data } = await Tesseract.recognize(imagePath, this.language, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`📝 OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const processingTime = Date.now() - startTime;

    return {
      text: data.text.trim(),
      confidence: data.confidence,
      processingTime,
    };
  }

  extractItemsFromText(text) {
    const items = [];
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    // Common patterns for receipt/bill items
    const patterns = [
      // Pattern: "Item Name - Qty - Price" or "Item Name Qty Price"
      /^(.+?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*(?:pcs?|pieces?|units?|kg|g|lbs?|oz)?\s*[-–—]\s*[\$₹€£]?(\d+(?:\.\d+)?)/i,

      // Pattern: "Item Name Qty x Price"
      /^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:pcs?|pieces?|units?|kg|g|lbs?|oz)?\s*[x×]\s*[\$₹€£]?(\d+(?:\.\d+)?)/i,

      // Pattern: "Qty Item Name Price"
      /^(\d+(?:\.\d+)?)\s*(?:pcs?|pieces?|units?|kg|g|lbs?|oz)?\s+(.+?)\s+[\$₹€£]?(\d+(?:\.\d+)?)/i,

      // Pattern: "Item Name: Qty @ Price"
      /^(.+?):\s*(\d+(?:\.\d+)?)\s*(?:pcs?|pieces?|units?|kg|g|lbs?|oz)?\s*@\s*[\$₹€£]?(\d+(?:\.\d+)?)/i,

      // Simple pattern: "Item Name Price" (assume qty = 1)
      /^(.+?)\s+[\$₹€£]?(\d+(?:\.\d+)?)$/i,
    ];

    for (const line of lines) {
      // Skip lines that look like headers, totals, or other non-item text
      if (this.shouldSkipLine(line)) {
        continue;
      }

      let matched = false;

      for (const pattern of patterns) {
        const match = line.match(pattern);

        if (match) {
          let name, quantity, price;

          if (pattern === patterns[patterns.length - 1]) {
            // Simple pattern: assume qty = 1
            name = match[1].trim();
            quantity = 1;
            price = parseFloat(match[2]) || 0;
          } else if (pattern === patterns[2]) {
            // "Qty Item Name Price" pattern
            quantity = parseFloat(match[1]) || 1;
            name = match[2].trim();
            price = parseFloat(match[3]) || 0;
          } else {
            // Standard patterns
            name = match[1].trim();
            quantity = parseFloat(match[2]) || 1;
            price = parseFloat(match[3]) || 0;
          }

          // Clean up item name
          name = this.cleanItemName(name);

          if (name.length > 2 && quantity > 0) {
            items.push({
              name,
              quantity,
              price,
              unit: this.extractUnit(line) || "pcs",
              category: this.guessCategory(name),
            });
            matched = true;
            break;
          }
        }
      }

      // If no pattern matched, try to extract just the item name
      if (!matched && line.length > 3 && line.length < 50) {
        const cleanName = this.cleanItemName(line);
        if (cleanName.length > 2 && !this.isLikelyNotAnItem(cleanName)) {
          items.push({
            name: cleanName,
            quantity: 1,
            price: 0,
            unit: "pcs",
            category: this.guessCategory(cleanName),
          });
        }
      }
    }

    // Remove duplicates and sort by name
    const uniqueItems = this.removeDuplicateItems(items);
    return uniqueItems.slice(0, 20); // Limit to 20 items
  }

  shouldSkipLine(line) {
    const skipPatterns = [
      /^(total|subtotal|tax|discount|amount|receipt|bill|invoice|date|time|thank you|visit again)/i,
      /^[\d\s\-\/\:\.]+$/, // Only numbers, spaces, and punctuation
      /^[^\w\s]*$/, // Only special characters
      /^.{0,2}$/, // Too short
      /^.{100,}$/, // Too long
    ];

    return skipPatterns.some((pattern) => pattern.test(line.trim()));
  }

  cleanItemName(name) {
    return name
      .replace(/^[\d\s\-\*\•]+/, "") // Remove leading numbers and bullets
      .replace(/[\$₹€£]\d+.*$/, "") // Remove trailing prices
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  extractUnit(text) {
    const unitMatch = text.match(
      /\b(pcs?|pieces?|units?|kg|kgs?|g|grams?|lbs?|pounds?|oz|ounces?|ml|l|liters?)\b/i
    );
    return unitMatch ? unitMatch[1].toLowerCase() : null;
  }

  guessCategory(itemName) {
    const categories = {
      "Food & Beverages": [
        "milk",
        "bread",
        "rice",
        "flour",
        "sugar",
        "salt",
        "oil",
        "tea",
        "coffee",
        "juice",
        "water",
        "snack",
        "biscuit",
        "cookie",
      ],
      "Fruits & Vegetables": [
        "apple",
        "banana",
        "orange",
        "tomato",
        "potato",
        "onion",
        "carrot",
        "spinach",
        "lettuce",
        "fruit",
        "vegetable",
      ],
      "Personal Care": [
        "soap",
        "shampoo",
        "toothpaste",
        "cream",
        "lotion",
        "deodorant",
        "perfume",
      ],
      Household: [
        "detergent",
        "cleaner",
        "tissue",
        "paper",
        "bag",
        "foil",
        "wrap",
      ],
      Medicine: [
        "tablet",
        "capsule",
        "syrup",
        "medicine",
        "vitamin",
        "supplement",
      ],
    };

    const lowerName = itemName.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => lowerName.includes(keyword))) {
        return category;
      }
    }

    return "General";
  }

  isLikelyNotAnItem(text) {
    const notItemPatterns = [
      /^(store|shop|market|mall|address|phone|email|website|www)/i,
      /^(cashier|clerk|manager|staff)/i,
      /^(gst|vat|tax|id|no|number)/i,
    ];

    return notItemPatterns.some((pattern) => pattern.test(text));
  }

  removeDuplicateItems(items) {
    const seen = new Set();
    return items.filter((item) => {
      const key = item.name.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  getMockOCRResult() {
    const mockTexts = [
      {
        text: "GROCERY RECEIPT\nApple - 5 pcs - $2.50\nBanana - 10 pcs - $1.80\nMilk - 2 bottles - $4.50\nBread - 1 loaf - $2.00\nTotal: $10.80",
        items: [
          {
            name: "Apple",
            quantity: 5,
            price: 2.5,
            unit: "pcs",
            category: "Fruits & Vegetables",
          },
          {
            name: "Banana",
            quantity: 10,
            price: 1.8,
            unit: "pcs",
            category: "Fruits & Vegetables",
          },
          {
            name: "Milk",
            quantity: 2,
            price: 4.5,
            unit: "bottles",
            category: "Food & Beverages",
          },
          {
            name: "Bread",
            quantity: 1,
            price: 2.0,
            unit: "loaf",
            category: "Food & Beverages",
          },
        ],
      },
      {
        text: "PHARMACY BILL\nParacetamol 500mg - 10 tablets - $3.20\nVitamin C - 30 capsules - $8.50\nCough Syrup - 1 bottle - $5.75",
        items: [
          {
            name: "Paracetamol 500mg",
            quantity: 10,
            price: 3.2,
            unit: "tablets",
            category: "Medicine",
          },
          {
            name: "Vitamin C",
            quantity: 30,
            price: 8.5,
            unit: "capsules",
            category: "Medicine",
          },
          {
            name: "Cough Syrup",
            quantity: 1,
            price: 5.75,
            unit: "bottle",
            category: "Medicine",
          },
        ],
      },
      {
        text: "SUPERMARKET\nRice 5kg - $12.00\nCooking Oil 1L - $4.50\nSalt 1kg - $1.20\nSugar 2kg - $3.80",
        items: [
          {
            name: "Rice",
            quantity: 5,
            price: 12.0,
            unit: "kg",
            category: "Food & Beverages",
          },
          {
            name: "Cooking Oil",
            quantity: 1,
            price: 4.5,
            unit: "L",
            category: "Food & Beverages",
          },
          {
            name: "Salt",
            quantity: 1,
            price: 1.2,
            unit: "kg",
            category: "Food & Beverages",
          },
          {
            name: "Sugar",
            quantity: 2,
            price: 3.8,
            unit: "kg",
            category: "Food & Beverages",
          },
        ],
      },
    ];

    const randomMock = mockTexts[Math.floor(Math.random() * mockTexts.length)];

    return {
      success: true,
      text: randomMock.text,
      confidence: 85 + Math.random() * 10, // 85-95% confidence
      items: randomMock.items,
      processingTime: 1500 + Math.random() * 1000, // 1.5-2.5 seconds
    };
  }
}

module.exports = new OCRService();
