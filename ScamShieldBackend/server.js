require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const alertRoutes = require("./routes/alerts");
const ocrRoutes = require("./routes/ocr");

// We'll initialize our cron job immediately
require("./cron/fetchScheduler");
const { seedHistoricalData } = require("./services/scraperService");

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Serve static files
const path = require("path");
app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/downloads", express.static(path.join(__dirname, "public")));
app.use("/app", express.static(path.join(__dirname, "public", "dist")));

// Fallback: serve PWA index.html for all /app/* routes (SPA deep-link support)
// Note: bare /app/* is invalid in path-to-regexp v8+ (Node 24). Use app.use() instead.
app.use("/app", (req, res, next) => {
  const ext = path.extname(req.path);
  if (ext && ext !== ".html") {
    return next(); // Let static middleware handle actual assets
  }
  res.sendFile(path.join(__dirname, "public", "dist", "index.html"));
});

// Dedicated Download Route with proper MIME headers
app.get("/download-apk", (req, res) => {
  const filePath = path.join(__dirname, "public", "ScamShield.apk");
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader("Content-Disposition", "attachment; filename=ScamShield.apk");
  res.sendFile(filePath);
});

// PWA Manifest for Home Screen Installation
app.get("/manifest.json", (req, res) => {
  res.json({
    "name": "Cyber Shield",
    "short_name": "Shield",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#020617",
    "theme_color": "#22d3ee",
    "icons": [
      {
        "src": "https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-blank/assets/icon.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ]
  });
});

// App Redirect & Landing Page Route (ROOT)
app.get("/", (req, res) => {
  res.redirect("/open-app");
});

app.get("/open-app", async (req, res) => {
  const ScamAlert = require("./models/ScamAlert");
  let statsCount = 1240; // Fallback
  try {
     statsCount = await ScamAlert.countDocuments();
  } catch (e) {
     console.error("Stats fetch error", e);
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Cyber Shield | Neural Link</title>
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#22d3ee">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <link rel="apple-touch-icon" href="https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-blank/assets/icon.png">

        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap');
            
            :root {
                --cyan: #22d3ee;
                --purple: #a855f7;
                --bg: #020617;
                --surface: rgba(15, 23, 42, 0.8);
                --border: rgba(34, 211, 238, 0.2);
            }

            * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
            
            body { 
                font-family: 'Outfit', sans-serif; 
                background: var(--bg); 
                color: #f8fafc; 
                overflow-x: hidden;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .background-glow {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 70%);
                z-index: -1;
            }

            .neural-grid {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background-image: 
                    linear-gradient(rgba(34, 211, 238, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(34, 211, 238, 0.05) 1px, transparent 1px);
                background-size: 50px 50px;
                transform: perspective(500px) rotateX(60deg) translateY(-100px);
                z-index: -1;
                opacity: 0.3;
            }

            .glass-panel {
                width: 90%;
                max-width: 440px;
                padding: 40px 30px;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 32px;
                backdrop-filter: blur(20px);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .logo-container {
                position: relative;
                width: 100px;
                height: 100px;
                margin: 0 auto 30px;
            }

            .shield-icon {
                font-size: 60px;
                color: var(--cyan);
                filter: drop-shadow(0 0 15px rgba(34, 211, 238, 0.6));
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.05); opacity: 1; }
                100% { transform: scale(1); opacity: 0.8; }
            }

            h1 {
                font-weight: 900;
                font-size: 36px;
                letter-spacing: -1px;
                margin-bottom: 10px;
                background: linear-gradient(to right, #fff, var(--cyan));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 16px;
                background: rgba(34, 211, 238, 0.1);
                border: 1px solid var(--border);
                border-radius: 100px;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 1px;
                color: var(--cyan);
                margin-bottom: 25px;
            }

            .status-dot {
                width: 6px;
                height: 6px;
                background: var(--cyan);
                border-radius: 50%;
                box-shadow: 0 0 10px var(--cyan);
            }

            p {
                color: #94a3b8;
                font-size: 15px;
                line-height: 1.6;
                margin-bottom: 35px;
                font-weight: 400;
            }

            .cta-stack {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .btn {
                position: relative;
                padding: 18px;
                border-radius: 16px;
                font-weight: 700;
                font-size: 15px;
                text-decoration: none;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                overflow: hidden;
            }

            .btn-primary {
                background: var(--cyan);
                color: #020617;
                box-shadow: 0 10px 20px -5px rgba(34, 211, 238, 0.4);
            }

            .btn-primary:active { transform: scale(0.98); }

            .btn-secondary {
                background: rgba(255, 255, 255, 0.05);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(5px);
            }

            .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); }

            .desktop-only { display: none; margin-top: 30px; }
            
            .qr-mockup {
                width: 150px;
                height: 150px;
                background: white;
                margin: 0 auto 15px;
                padding: 10px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            @media (min-width: 768px) {
                .desktop-only { display: block; }
                .mobile-cta { display: none; }
                h1 { font-size: 42px; }
                .glass-panel { max-width: 500px; padding: 50px 40px; }
            }

            .footer-info {
                margin-top: 40px;
                font-size: 11px;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 2px;
            }

            /* Live Ticker Styling */
            .live-ticker-container {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 35px;
                background: rgba(34, 211, 238, 0.1);
                backdrop-filter: blur(10px);
                border-top: 1px solid var(--border);
                display: flex;
                align-items: center;
                overflow: hidden;
                z-index: 100;
            }

            .ticker-label {
                background: var(--cyan);
                color: #020617;
                padding: 0 15px;
                height: 100%;
                display: flex;
                align-items: center;
                font-weight: 900;
                font-size: 10px;
                letter-spacing: 1px;
                z-index: 2;
            }

            .ticker-content {
                display: flex;
                white-space: nowrap;
                padding-left: 20px;
                animation: scrollTicker 30s linear infinite;
            }

            .ticker-item {
                margin-right: 40px;
                font-size: 11px;
                font-weight: 600;
                color: var(--cyan);
                text-transform: uppercase;
            }

            @keyframes scrollTicker {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
        </style>
    </head>
    <body>
        <div class="background-glow"></div>
        <div class="neural-grid"></div>

        <div class="glass-panel">
            <div class="logo-container">
                <i class="fas fa-shield-halved shield-icon"></i>
            </div>

            <div class="status-badge">
                <div class="status-dot"></div>
                NEURAL_LINK ACTIVE
            </div>

            <h1>Cyber Shield</h1>
            <div class="status-badge" style="background: rgba(168, 85, 247, 0.1); color: #a855f7; border-color: rgba(168, 85, 247, 0.2); margin-top: -10px;">
                <i class="fas fa-microchip" style="margin-right: 5px;"></i>
                LIVE_THREATS_DETECTED: ${statsCount.toLocaleString()}
            </div>
            <p>Your regional threat intelligence network. Protecting 1.4B+ identities from digital fraud across India.</p>

            <div class="cta-stack mobile-cta">
                <a href="/app" class="btn btn-primary" style="background: var(--purple); color: white; border: none; box-shadow: 0 10px 20px -5px rgba(168, 85, 247, 0.4);">
                    <i class="fas fa-network-wired"></i>
                    ENTER NEURAL NETWORK
                </a>
                <a href="emailscamshield://" class="btn btn-secondary" id="launchBtn">
                    <i class="fas fa-bolt"></i>
                    LAUNCH NATIVE APP
                </a>
                <a href="/download-apk" class="btn btn-secondary">
                    <i class="fas fa-download"></i>
                    DOWNLOAD OFFLINE APK
                </a>
            </div>

            <div class="desktop-only">
                <p style="margin-bottom: 20px;">Open this page on your mobile device or scan to install:</p>
                <div class="qr-mockup" id="qrContainer">
                   <!-- Changed from req.get('host') to hardcoded IP to ensure mobile scans work correctly -->
                   <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=http://192.168.1.5:5000/app" alt="QR" />
                </div>
                <div class="status-badge" style="background: rgba(34, 211, 238, 0.1); border: 1px solid var(--border);">
                   MOBILE ACCESS PORTAL
                </div>
            </div>

            <div class="footer-info">
                Secure Neural Node: ${req.get('host')}
            </div>
        </div>

        <!-- Live Activity Ticker -->
        <div class="live-ticker-container" id="tickerContainer">
            <div class="ticker-label">LIVE_ACTIVITY</div>
            <div class="ticker-content" id="tickerContent">
                <span class="ticker-item">[INFO] INITIALIZING NEURAL FEED...</span>
                <span class="ticker-item">[INFO] SYNCING GLOBAL THREAT SIGNATURES...</span>
                <span class="ticker-item">[INFO] PROTECTING BHARTI NODES...</span>
            </div>
        </div>

        <script>
            // Automatic detection and redirect for mobile
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            
            if (isMobile) {
                // Short delay to allow DOM to load then attempt launch
                setTimeout(() => {
                    const hasLaunched = localStorage.getItem('appLaunched');
                    if (!hasLaunched) {
                       window.location.href = "emailscamshield://";
                       localStorage.setItem('appLaunched', 'true');
                    }
                }, 1500);
            }

            // Fetch live data for ticker
            async function updateTicker() {
                try {
                    const res = await fetch('/api/alerts?limit=10');
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        const content = document.getElementById('tickerContent');
                        const tickerText = data.map(item => \`[THREAT_NEUTRALIZED] \${item.title.toUpperCase()} in \${item.state.toUpperCase()}\`).join(' &nbsp;&nbsp; | &nbsp;&nbsp; ');
                        content.innerHTML = \`<span class="ticker-item">\${tickerText}</span><span class="ticker-item">\${tickerText}</span>\`;
                    }
                } catch (e) { console.error(e); }
            }
            updateTicker();
            setInterval(updateTicker, 60000);

            // Button interaction
            document.getElementById('launchBtn')?.addEventListener('click', () => {
                setTimeout(() => {
                    alert("If the app didn't open, please ensure it's installed or download the APK below.");
                }, 2000);
            });
        </script>
    </body>
    </html>
  `);
});

// Routes
app.use("/api/alerts", alertRoutes);
app.use("/api/ocr", ocrRoutes);

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scamshield";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Backend server running on port ${PORT} at 0.0.0.0`);
      seedHistoricalData().catch(console.error); // Seed 10 years of data on startup
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    console.log("\n--- WARNING ---");
    console.log("Please ensure you have MongoDB installed locally and running.");
    console.log("-----------------\n");
  });
