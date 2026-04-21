const express = require("express");
const router = express.Router();
const ScamAlert = require("../models/ScamAlert");

// GET /api/alerts -> Get all scam alerts (latest 50)
router.get("/", async (req, res) => {
  try {
    const alerts = await ScamAlert.find().sort({ publishedAt: -1 }).limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// GET /api/alerts/history -> Fetch everything (paginated to avoid crashing)
router.get("/history", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.state && req.query.state !== "All States") {
      query.state = { $regex: new RegExp(req.query.state, "i") };
    }
    if (req.query.type && req.query.type !== "All Types") {
      query.category = { $regex: new RegExp(req.query.type, "i") };
    }
    if (req.query.year && req.query.year !== "All Years") {
      const yearStr = req.query.year;
      if (yearStr.startsWith("Last")) {
        const numMatch = yearStr.match(/\d+/);
        if (numMatch) {
          const numYears = parseInt(numMatch[0]);
          const cutoffYear = new Date().getFullYear() - numYears + 1;
          query.publishedAt = {
            $gte: new Date(`${cutoffYear}-01-01`),
          };
        }
      } else {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          query.publishedAt = {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          };
        }
      }
    }

    const alerts = await ScamAlert.find(query).sort({ publishedAt: -1 }).skip(skip).limit(limit);
    const total = await ScamAlert.countDocuments(query);

    res.json({
      data: alerts,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch historical alerts" });
  }
});

// GET /api/alerts?state=Andhra Pradesh
// This falls back if req.query.state is used on /api/alerts but let's make a dedicated route just in case
router.get("/state/:state", async (req, res) => {
  try {
    const state = req.params.state;
    // use regex to be case insensitive
    const alerts = await ScamAlert.find({ state: { $regex: new RegExp(state, "i") } })
                                  .sort({ publishedAt: -1 })
                                  .limit(2000); // Return up to 2000 historic entries
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/alerts/search?q=keyword
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter 'q'" });
    }

    const alerts = await ScamAlert.find({
      $or: [
        { title: { $regex: new RegExp(query, "i") } },
        { description: { $regex: new RegExp(query, "i") } },
        { category: { $regex: new RegExp(query, "i") } }
      ]
    }).sort({ publishedAt: -1 }).limit(50);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: "Server error during search" });
  }
});

// Manually trigger a scrape (for development/testing)
router.post("/trigger-scrape", async (req, res) => {
  try {
    const { fetchLatestScams } = require("../services/scraperService");
    await fetchLatestScams();
    res.json({ message: "Scraping job completed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Scraping failed", details: error.message });
  }
});

// GET /api/alerts/stats -> Aggregate counts per state
router.get("/stats", async (req, res) => {
  try {
    const stats = await ScamAlert.aggregate([
      {
        $group: {
          _id: "$state",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          state: "$_id",
          count: 1
        }
      }
    ]);

    // Convert array to Record object for easier frontend consumption
    const statsObj = {};
    stats.forEach(s => {
      if (s.state) statsObj[s.state] = s.count;
    });

    res.json(statsObj);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats", details: error.message });
  }
});

// POST /api/alerts/scan -> Backend Heuristics Text Scanner
router.post("/scan", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const lowercaseText = text.toLowerCase();
    const reasons = [];
    let score = 0; // Out of 100

    const URGENCY_TRIGGERS = ["urgent", "verify now", "account suspended", "limited time", "immediate action required", "final notice", "account warning", "security alert", "suspension", "expire", "closing your account", "action required", "within 24 hours", "unauthorized access", "validate your account", "attention required", "cancel request", "login immediately", "identity verification"];
    const FINANCIAL_TRIGGERS = ["bank transfer", "lottery winner", "prize", "jackpot", "invoice attached", "payment confirmation", "refund processing", "wire transfer", "gift card", "crypto", "bitcoin", "claim your reward", "tax refund", "cash app", "zelle", "venmo", "western union", "overdue payment", "billing error"];
    const INDIA_SCAM_TRIGGERS = ["upi pin", "kbc lottery", "customs fee", "youtube likes", "work from home", "daily payment", "digital arrest", "cbi verification", "customs clearance", "part time job", "earn money online", "telegram group", "whatsapp group", "electricity bill pending", "sim block", "paytm kyc", "aadhar update", "jio mart franchise", "pm yojana", "trai caller tune"];
    const SUSPICIOUS_TLDS = [".xyz", ".ru", ".top", ".click", ".win", ".bid", ".cc", ".icu", ".wang", ".link", ".date", ".review", ".country", ".kim", ".party", ".science", ".work", ".gq", ".ml", ".cf", ".tk"];
    const BRAND_SPOOFS = [
      { pattern: "paypai", target: "paypal" }, { pattern: "arnazon", target: "amazon" }, { pattern: "amnzon", target: "amazon" },
      { pattern: "netfiix", target: "netflix" }, { pattern: "mircosoft", target: "microsoft" }, { pattern: "googIe", target: "google" },
      { pattern: "hdfcbank-update", target: "hdfc" }, { pattern: "sbireward", target: "sbi" }, { pattern: "icicirewards", target: "icici" },
      { pattern: "appIe", target: "apple" }, { pattern: "faceb00k", target: "facebook" }
    ];
    const SAFETY_TIPS = [
      "Never click unknown verification links in emails.", "Check the sender's email address carefully for typos.",
      "Large companies will never ask for your password via email.", "Verify urgent requests by calling the company's official number.",
      "Be wary of emails that create a sense of extreme urgency.", "If it sounds too good to be true, it probably is (like lottery wins).",
      "Government agencies (like CBI/Police) do NOT 'Digitally Arrest' citizens via Skype.", "Never share your UPI PIN to RECEIVE money. PIN is only for sending.",
      "Customs departments do not ask for clearance fees transferred to personal accounts."
    ];

    const foundUrgency = URGENCY_TRIGGERS.filter(k => lowercaseText.includes(k));
    if (foundUrgency.length > 0) { score += Math.min(foundUrgency.length * 15, 30); reasons.push(`Urgent/Manipulative language: "${foundUrgency[0]}"`); }

    const foundFinancial = FINANCIAL_TRIGGERS.filter(k => lowercaseText.includes(k));
    if (foundFinancial.length > 0) { score += Math.min(foundFinancial.length * 20, 40); reasons.push(`Financial request/hook detected: "${foundFinancial[0]}"`); }

    const foundIndiaScams = INDIA_SCAM_TRIGGERS.filter(k => lowercaseText.includes(k));
    if (foundIndiaScams.length > 0) { score += Math.min(foundIndiaScams.length * 40, 60); reasons.push(`Known regional scam pattern: "${foundIndiaScams[0]}"`); }

    const foundTLDs = SUSPICIOUS_TLDS.filter(tld => lowercaseText.includes(tld));
    const hasIPAddressLink = /http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(lowercaseText);
    if (foundTLDs.length > 0 || hasIPAddressLink) { score += 40; reasons.push(`Suspicious/Masked link detected`); }

    const foundSpoofs = BRAND_SPOOFS.filter(m => lowercaseText.includes(m.pattern));
    if (foundSpoofs.length > 0) { score += 50; reasons.push(`Brand Impersonation (Spoofing): "${foundSpoofs[0].target}"`); }

    score = Math.min(score, 99);
    let riskLevel = "Safe";
    if (score === 0 && (lowercaseText.includes("dear") || lowercaseText.includes("kindly"))) score += 5;
    if (score >= 60) riskLevel = "High Risk";
    else if (score >= 20) riskLevel = "Suspicious";

    let tip = SAFETY_TIPS[0];
    if (foundIndiaScams.includes("cbi verification") || foundIndiaScams.includes("digital arrest")) tip = SAFETY_TIPS[6];
    else if (foundIndiaScams.includes("upi pin")) tip = SAFETY_TIPS[7];
    else if (foundIndiaScams.includes("customs fee")) tip = SAFETY_TIPS[8];
    else if (reasons.length > 0) tip = SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)];
    else tip = "This text looks safe, but always double-check the sender's identity.";

    res.json({
      riskScore: score === 0 ? Math.floor(Math.random() * 5) + 1 : score, 
      riskLevel,
      reasons: reasons.length > 0 ? reasons : ["No explicit threat signatures detected."],
      tip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Scanner Engine failed", details: error.message });
  }
});

module.exports = router;
