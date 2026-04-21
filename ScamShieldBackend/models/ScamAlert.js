const mongoose = require("mongoose");

const scamAlertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  source: {
    type: String
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  state: {
    type: String,
    index: true // index for faster queries
  },
  category: {
    type: String,
    enum: [
      "phishing", 
      "banking fraud", 
      "identity theft", 
      "investment scam",
      "upi scam",
      "digital arrest",
      "otp scam",
      "job fraud",
      "online scam",
      "other"
    ],
    default: "other",
    index: true
  },
  threat_level: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  image: {
    type: String
  }
}, { timestamps: true });

// Create a compound index for easy sorting and filtering
scamAlertSchema.index({ publishedAt: -1, state: 1 });

module.exports = mongoose.model("ScamAlert", scamAlertSchema);
