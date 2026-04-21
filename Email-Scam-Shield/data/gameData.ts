export interface GateMessage {
  text: string;
  isScam: boolean;
  explanation: string;
}

export interface GameLevel {
  level: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  pairs: [GateMessage, GateMessage][];
}

const BEGINNER_PAIRS: [GateMessage, GateMessage][] = [
  [
    { text: "URGENT: Verify your bank account immediately using this link", isScam: true, explanation: "Urgency + asking to click a link is a classic phishing tactic." },
    { text: "Your Amazon order has been shipped and will arrive tomorrow", isScam: false, explanation: "Normal order confirmation with no action required." },
  ],
  [
    { text: "Claim your lottery prize of ₹10 lakh NOW! Act fast!", isScam: true, explanation: "You cannot win a lottery you did not enter." },
    { text: "Your Netflix subscription was successfully renewed this month", isScam: false, explanation: "Normal subscription confirmation email." },
  ],
  [
    { text: "Your account is SUSPENDED. Click here to restore access now", isScam: true, explanation: "Fake suspension threats are used to steal login credentials." },
    { text: "Your Flipkart order has been delivered. Rate your experience", isScam: false, explanation: "Normal delivery confirmation with optional review." },
  ],
  [
    { text: "Pay ₹500 fee immediately or your service will be terminated", isScam: true, explanation: "Legitimate services send invoices, not urgent payment threats." },
    { text: "Your Google Photos backup completed successfully yesterday", isScam: false, explanation: "Normal automatic backup notification." },
  ],
  [
    { text: "You won a FREE iPhone 16! Claim within 24 hours or lose it", isScam: true, explanation: "Prize claims with tight deadlines are always scams." },
    { text: "Your credit card statement for February is now available", isScam: false, explanation: "Normal monthly statement notification from your bank." },
  ],
  [
    { text: "SECURITY ALERT: Share OTP to prevent unauthorized access", isScam: true, explanation: "No legitimate service ever asks you to share your OTP." },
    { text: "Your food delivery order is out for delivery, arriving in 15 mins", isScam: false, explanation: "Normal food delivery tracking update." },
  ],
  [
    { text: "Your KYC is expired. Update now to avoid account freezing", isScam: true, explanation: "Banks never ask for KYC via links. Visit your branch directly." },
    { text: "Your electricity bill for March has been generated", isScam: false, explanation: "Normal utility billing notification." },
  ],
  [
    { text: "Work from home! Earn ₹50,000/month. Pay ₹2,000 to register", isScam: true, explanation: "Jobs that charge registration fees are always fraudulent." },
    { text: "Your flight check-in opens in 24 hours for tomorrow's trip", isScam: false, explanation: "Normal airline pre-flight check-in reminder." },
  ],
  [
    { text: "Your Aadhaar will be deactivated in 24 hours. Update now", isScam: true, explanation: "UIDAI never deactivates Aadhaar via SMS/email threats." },
    { text: "Your package from Meesho has been dispatched successfully", isScam: false, explanation: "Normal e-commerce dispatch confirmation." },
  ],
  [
    { text: "CBI NOTICE: Your number linked to fraud. Pay ₹10,000 or arrested", isScam: true, explanation: "Law enforcement never demands money over phone calls." },
    { text: "Your UPI transaction of ₹500 to Swiggy is successful", isScam: false, explanation: "Normal payment confirmation from your UPI app." },
  ],
];

const INTERMEDIATE_PAIRS: [GateMessage, GateMessage][] = [
  [
    { text: "Update your account information to avoid temporary suspension of services", isScam: true, explanation: "Vague 'update account' requests with suspension threats are phishing." },
    { text: "Your HDFC credit card reward points will expire next month", isScam: false, explanation: "Normal bank reward points expiry reminder." },
  ],
  [
    { text: "Security update required: Re-enter your credentials to verify identity", isScam: true, explanation: "Legitimate services never ask you to re-enter credentials via email." },
    { text: "Your Amazon Prime membership renewed successfully for another year", isScam: false, explanation: "Normal membership renewal confirmation." },
  ],
  [
    { text: "Your payment was declined. Update billing details to restore service", isScam: true, explanation: "Go directly to the service website — never click email links for billing." },
    { text: "Your Swiggy order has been confirmed and will be ready in 30 minutes", isScam: false, explanation: "Normal food order confirmation." },
  ],
  [
    { text: "Unusual sign-in detected from new device. Verify account ownership now", isScam: true, explanation: "Fake security alerts trick users into giving up account access." },
    { text: "Your SBI net banking password will expire in 30 days", isScam: false, explanation: "Normal system-generated password expiry reminder." },
  ],
  [
    { text: "Tax refund of ₹8,500 credited. Fill form to receive it in your account", isScam: true, explanation: "Tax refunds go directly to your linked account — no forms needed." },
    { text: "Your insurance premium auto-payment was processed successfully", isScam: false, explanation: "Normal insurance premium debit notification." },
  ],
  [
    { text: "COVID relief fund: You are eligible for ₹15,000. Click to apply today", isScam: true, explanation: "Government fund scams exploit public health awareness." },
    { text: "Your Zomato Pro subscription has been renewed for 3 months", isScam: false, explanation: "Normal app subscription renewal notification." },
  ],
  [
    { text: "Your Gmail account has been accessed from a new location. Secure it now", isScam: true, explanation: "Google sends alerts via the app — links in emails may be phishing." },
    { text: "Your Jio postpaid bill of ₹699 is due on 15th of this month", isScam: false, explanation: "Normal telecom billing reminder." },
  ],
  [
    { text: "Investment scheme: Guaranteed 40% returns. Register with ₹5,000 today", isScam: true, explanation: "No legitimate investment guarantees fixed high returns. SEBI fraud." },
    { text: "Your DigiLocker document verification was completed successfully", isScam: false, explanation: "Normal government document portal notification." },
  ],
  [
    { text: "Your IRCTC booking failed. Re-enter card details to confirm ticket", isScam: true, explanation: "Always use official IRCTC app/website — never follow email links." },
    { text: "Reminder: Your Airtel broadband plan renews on the 20th", isScam: false, explanation: "Normal telecom plan renewal reminder." },
  ],
  [
    { text: "PM Kisan: ₹6,000 installment ready. Enter Aadhaar to receive payment", isScam: true, explanation: "Government schemes never collect Aadhaar via SMS links." },
    { text: "Your PhonePe UPI transaction of ₹1,200 was successful", isScam: false, explanation: "Normal payment confirmation from PhonePe." },
  ],
];

const ADVANCED_PAIRS: [GateMessage, GateMessage][] = [
  [
    { text: "PayPaI Security Alert: Suspicious activity detected on your account", isScam: true, explanation: "Note the capital 'I' instead of lowercase 'l' in PayPaI — classic spoofing trick." },
    { text: "Your PayPal payment to Shopify was processed successfully today", isScam: false, explanation: "Normal PayPal transaction confirmation from the real PayPal domain." },
  ],
  [
    { text: "secure-bank-update.xyz: Action required on your SBI account today", isScam: true, explanation: "SBI's real domain is sbi.co.in — not .xyz which is a suspicious TLD." },
    { text: "Your SBI account balance has been updated after your recent transaction", isScam: false, explanation: "Normal bank account update notification." },
  ],
  [
    { text: "Arnazon.in: Your order has a payment issue. Update details within 12 hours", isScam: true, explanation: "Note 'Arnazon' — the 'rn' looks like 'm'. This is a lookalike domain attack." },
    { text: "Amazon India: Your order for USB-C Hub has been shipped (OTR-882341)", isScam: false, explanation: "Legitimate Amazon email with real order number from amazon.in domain." },
  ],
  [
    { text: "Netf1ix.com: Your account was accessed from Chennai. Verify now", isScam: true, explanation: "The '1' in Netf1ix is the number one, not letter 'l'. Domain spoofing attack." },
    { text: "Netflix: Your payment method was successfully updated for next billing", isScam: false, explanation: "Normal Netflix payment confirmation from the real netflix.com domain." },
  ],
  [
    { text: "ICICI-secure-portal.net: Your beneficiary limit must be reset today", isScam: true, explanation: "ICICI's real domain is icicibank.com — third-party domain is phishing." },
    { text: "ICICI Bank: Your credit card payment of ₹8,500 was processed today", isScam: false, explanation: "Normal bank transaction confirmation from the official domain." },
  ],
  [
    { text: "Your account team: We noticed login from IP 203.x.x.x. Verify identity", isScam: true, explanation: "Vague 'account team' with no branding and technical-sounding IP info is a social engineering tactic." },
    { text: "Google: Sign-in successful from Chrome on Windows 11 in Mumbai", isScam: false, explanation: "Normal Google sign-in notification you can verify in your account settings." },
  ],
  [
    { text: "Gorvernment of India: Your PAN card requires urgent revalidation today", isScam: true, explanation: "Spelling error 'Gorvernment' and urgent PAN card revalidation is a known scam tactic." },
    { text: "Income Tax Department: Your ITR has been processed. Check portal for details", isScam: false, explanation: "Normal ITR processing notification from official Income Tax Department." },
  ],
  [
    { text: "Reward: You scored top 5% of Google users. Claim your gift card now", isScam: true, explanation: "Google does not rank users or offer gift cards via email. Social engineering." },
    { text: "Google Pay: You received ₹500 from Rahul Verma via UPI transfer today", isScam: false, explanation: "Normal Google Pay incoming payment notification." },
  ],
  [
    { text: "support@hdfc-customers.ru: Verify your HDFC account within 48 hours", isScam: true, explanation: "HDFC's domain is hdfcbank.com. The .ru (Russian) domain is a clear red flag." },
    { text: "HDFC Bank: Your fixed deposit of ₹50,000 matures on 15th April 2026", isScam: false, explanation: "Normal bank FD maturity notification from the official HDFC domain." },
  ],
  [
    { text: "Hello, this is your account manager. Your profile needs final verification", isScam: true, explanation: "Extremely vague sender with no company name. Social engineering through familiarity." },
    { text: "LinkedIn: Sanjay Kumar viewed your profile in the last 3 days this week", isScam: false, explanation: "Normal LinkedIn profile view notification from linkedin.com." },
  ],
];

export const GAME_LEVELS: GameLevel[] = [
  { level: 1, difficulty: "Beginner", pairs: BEGINNER_PAIRS.slice(0, 5) },
  { level: 2, difficulty: "Beginner", pairs: BEGINNER_PAIRS.slice(5, 10) },
  { level: 3, difficulty: "Beginner", pairs: [...BEGINNER_PAIRS.slice(0, 3), ...BEGINNER_PAIRS.slice(7, 10)] },
  { level: 4, difficulty: "Intermediate", pairs: INTERMEDIATE_PAIRS.slice(0, 5) },
  { level: 5, difficulty: "Intermediate", pairs: INTERMEDIATE_PAIRS.slice(5, 10) },
  { level: 6, difficulty: "Intermediate", pairs: [...INTERMEDIATE_PAIRS.slice(0, 3), ...INTERMEDIATE_PAIRS.slice(7, 10)] },
  { level: 7, difficulty: "Intermediate", pairs: [...INTERMEDIATE_PAIRS.slice(2, 7)] },
  { level: 8, difficulty: "Advanced", pairs: ADVANCED_PAIRS.slice(0, 5) },
  { level: 9, difficulty: "Advanced", pairs: ADVANCED_PAIRS.slice(5, 10) },
  { level: 10, difficulty: "Advanced", pairs: [...ADVANCED_PAIRS.slice(0, 3), ...ADVANCED_PAIRS.slice(7, 10)] },
];

export function getRank(score: number): { rank: string; color: string } {
  if (score >= 90) return { rank: "Cyber Defender", color: "#22D3EE" };
  if (score >= 70) return { rank: "Scam Spotter", color: "#3B82F6" };
  if (score >= 50) return { rank: "Beginner", color: "#A855F7" };
  return { rank: "Needs Training", color: "#EF4444" };
}

export const AVATARS = [
  { id: "ninja", name: "Cyber Ninja", emoji: "🥷", color: "#22D3EE" },
  { id: "guardian", name: "AI Guardian", emoji: "🤖", color: "#3B82F6" },
  { id: "hacker", name: "Security Hacker", emoji: "👾", color: "#A855F7" },
  { id: "robot", name: "Tech Robot", emoji: "🦾", color: "#22C55E" },
];
