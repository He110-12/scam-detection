export interface ScanResult {
  riskScore: number; // 0 to 100
  riskLevel: "Safe" | "Suspicious" | "High Risk";
  reasons: string[];
  tip: string;
}

const URGENCY_TRIGGERS = [
  "urgent", "verify now", "account suspended", "limited time", "immediate action required", "final notice", 
  "account warning", "security alert", "suspension", "expire", "closing your account", "action required",
  "within 24 hours", "unauthorized access", "validate your account", "attention required", "cancel request",
  "login immediately", "identity verification"
];

const FINANCIAL_TRIGGERS = [
  "bank transfer", "lottery winner", "prize", "jackpot", "invoice attached", "payment confirmation", 
  "refund processing", "wire transfer", "gift card", "crypto", "bitcoin", "claim your reward", "tax refund",
  "cash app", "zelle", "venmo", "western union", "overdue payment", "billing error"
];

const INDIA_SCAM_TRIGGERS = [
  "upi pin", "kbc lottery", "customs fee", "youtube likes", "work from home", "daily payment", 
  "digital arrest", "cbi verification", "customs clearance", "part time job", "earn money online", 
  "telegram group", "whatsapp group", "electricity bill pending", "sim block", "paytm kyc", "aadhar update",
  "jio mart franchise", "pm yojana", "trai caller tune"
];

const SUSPICIOUS_TLDS = [
  ".xyz", ".ru", ".top", ".click", ".win", ".bid", ".cc", ".icu", ".wang", ".link", ".date", ".review", 
  ".country", ".kim", ".party", ".science", ".work", ".gq", ".ml", ".cf", ".tk"
];

const BRAND_SPOOFS = [
  { pattern: "paypai", target: "paypal" },
  { pattern: "arnazon", target: "amazon" },
  { pattern: "amnzon", target: "amazon" },
  { pattern: "netfiix", target: "netflix" },
  { pattern: "mircosoft", target: "microsoft" },
  { pattern: "googIe", target: "google" },
  { pattern: "hdfcbank-update", target: "hdfc" },
  { pattern: "sbireward", target: "sbi" },
  { pattern: "icicirewards", target: "icici" },
  { pattern: "appIe", target: "apple" },
  { pattern: "faceb00k", target: "facebook" }
];

const SAFETY_TIPS = [
  "Never click unknown verification links in emails.",
  "Check the sender's email address carefully for typos.",
  "Large companies will never ask for your password via email.",
  "Verify urgent requests by calling the company's official number.",
  "Be wary of emails that create a sense of extreme urgency.",
  "If it sounds too good to be true, it probably is (like lottery wins).",
  "Government agencies (like CBI/Police) do NOT 'Digitally Arrest' citizens via Skype.",
  "Never share your UPI PIN to RECEIVE money. PIN is only for sending.",
  "Customs departments do not ask for clearance fees transferred to personal accounts."
];

export const scanEmailText = (text: string): ScanResult => {
  const lowercaseText = text.toLowerCase();
  const reasons: string[] = [];
  let score = 0; // Out of 100

  // 1. Check for Phishing / Urgency Keywords
  const foundUrgency = URGENCY_TRIGGERS.filter(k => lowercaseText.includes(k));
  if (foundUrgency.length > 0) {
    score += Math.min(foundUrgency.length * 15, 30);
    reasons.push(`Urgent/Manipulative language: "${foundUrgency[0]}"`);
  }

  // 2. Financial Scams
  const foundFinancial = FINANCIAL_TRIGGERS.filter(k => lowercaseText.includes(k));
  if (foundFinancial.length > 0) {
    score += Math.min(foundFinancial.length * 20, 40);
    reasons.push(`Financial request/hook detected: "${foundFinancial[0]}"`);
  }

  // 3. Region Specific (India)
  const foundIndiaScams = INDIA_SCAM_TRIGGERS.filter(k => lowercaseText.includes(k));
  if (foundIndiaScams.length > 0) {
    score += Math.min(foundIndiaScams.length * 40, 60);
    reasons.push(`Known regional scam pattern: "${foundIndiaScams[0]}"`);
  }

  // 4. Suspicious Domains/Links
  const foundTLDs = SUSPICIOUS_TLDS.filter(tld => lowercaseText.includes(tld));
  // Extra check for IP URLs
  const hasIPAddressLink = /http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(lowercaseText);
  if (foundTLDs.length > 0 || hasIPAddressLink) {
    score += 40;
    reasons.push(`Suspicious/Masked link detected`);
  }

  // 5. Lookalike Domains
  const foundSpoofs = BRAND_SPOOFS.filter(m => lowercaseText.includes(m.pattern));
  if (foundSpoofs.length > 0) {
    score += 50;
    reasons.push(`Brand Impersonation (Spoofing): "${foundSpoofs[0].target}"`);
  }

  // Determine Level
  score = Math.min(score, 99); // max 99 if not explicit 100
  let riskLevel: "Safe" | "Suspicious" | "High Risk" = "Safe";
  
  if (score === 0) {
    if (lowercaseText.includes("dear") || lowercaseText.includes("kindly")) {
      score += 5;
    }
  }

  if (score >= 60) riskLevel = "High Risk";
  else if (score >= 20) riskLevel = "Suspicious";

  // Pick a relevant tip
  let tip = SAFETY_TIPS[0];
  if (foundIndiaScams.includes("cbi verification") || foundIndiaScams.includes("digital arrest")) tip = SAFETY_TIPS[6];
  else if (foundIndiaScams.includes("upi pin")) tip = SAFETY_TIPS[7];
  else if (foundIndiaScams.includes("customs fee")) tip = SAFETY_TIPS[8];
  else if (reasons.length > 0) tip = SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)];
  else tip = "This text looks safe, but always double-check the sender's identity.";

  return {
    riskScore: score === 0 ? Math.floor(Math.random() * 5) + 1 : score, 
    riskLevel,
    reasons: reasons.length > 0 ? reasons : ["No explicit threat signatures detected."],
    tip
  };
};
