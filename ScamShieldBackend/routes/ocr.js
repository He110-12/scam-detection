const express = require('express');
const router = express.Router();
const Tesseract = require('tesseract.js');

// POST /api/ocr -> Accepts {"image": "base64_string"}
router.post('/', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image provided for OCR." });
    }

    // Recognize text using Tesseract.js ML Engine
    const { data: { text } } = await Tesseract.recognize(
      image,
      'eng',
      { 
        logger: m => {
          if (m.status === 'recognizing text' && m.progress === 1) {
            console.log(`[OCR] Recognition successful for user request`);
          }
        } 
      }
    );

    if (!text || text.trim().length === 0) {
      console.warn("[OCR] No text found in provided image");
      return res.status(422).json({ error: "OCR Engine could not extract any readable text from this image." });
    }

    res.json({ text: text.trim() });
  } catch (error) {
    console.error("!!! OCR CRITICAL FAILURE !!!", error);
    res.status(500).json({ 
      error: "Neural OCR extraction failed.", 
      details: error.message,
      suggestion: "Ensure the image is clear and contains readable Latin text."
    });
  }
});

module.exports = router;
