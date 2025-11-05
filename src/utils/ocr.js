// Placeholder OCR API function
// In a real app, this would send the image to an actual OCR service like Google Vision API, Tesseract.js, etc.

export const processImageOCR = async (imageUri) => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Placeholder: Simulated OCR response
    // In production, replace this with actual OCR API call
    const mockOCRResponse = {
      text: `ITEM NAME\tQUANTITY\tPRICE\nApple\t10\t$2.50\nBanana\t15\t$1.80\nOrange\t8\t$3.00\nMilk\t5\t$4.50\nBread\t12\t$2.00`,
      confidence: 0.95,
    };
    
    // Parse the text into items
    const items = parseOCRText(mockOCRResponse.text);
    
    return {
      success: true,
      items,
      rawText: mockOCRResponse.text,
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    return {
      success: false,
      items: [],
      rawText: '',
      error: error.message,
    };
  }
};

// Parse OCR text into structured items
const parseOCRText = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  const items = [];
  
  // Skip header line if it exists
  const startIndex = lines[0].toLowerCase().includes('item') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    
    // Try to parse different formats
    // Format 1: TAB separated (Item Name\tQuantity\tPrice)
    let parts = line.split('\t');
    
    // Format 2: Multiple spaces
    if (parts.length < 3) {
      parts = line.split(/\s{2,}/);
    }
    
    // Format 3: Comma separated
    if (parts.length < 3) {
      parts = line.split(',');
    }
    
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const quantity = parseInt(parts[1].trim()) || 1;
      
      // Try to extract price if available
      let price = 0;
      if (parts.length >= 3) {
        const priceStr = parts[2].trim().replace(/[^0-9.]/g, '');
        price = parseFloat(priceStr) || 0;
      }
      
      if (name) {
        items.push({
          name,
          quantity,
          price,
          minStock: Math.floor(quantity * 0.2), // Set min stock to 20% of quantity
        });
      }
    }
  }
  
  // If no items were parsed, create a default item
  if (items.length === 0 && text.trim()) {
    items.push({
      name: text.trim().substring(0, 50),
      quantity: 1,
      price: 0,
      minStock: 1,
    });
  }
  
  return items;
};
