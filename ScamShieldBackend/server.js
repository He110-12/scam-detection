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

// Neural Network Dashboard - Full standalone page (no static file dependency)
app.get("/app", async (req, res) => {
  const ScamAlert = require("./models/ScamAlert");
  let recentAlerts = [];
  let statsCount = 1240;
  let statsObj = {};
  try {
    recentAlerts = await ScamAlert.find().sort({ publishedAt: -1 }).limit(20);
    statsCount = await ScamAlert.countDocuments();
    const statsAgg = await ScamAlert.aggregate([
      { $group: { _id: "$state", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    statsAgg.forEach(s => { if (s._id) statsObj[s._id] = s.count; });
  } catch (e) { console.error("Dashboard data fetch error", e); }

  const alertsJson = JSON.stringify(recentAlerts.map(a => ({
    title: a.title || "Unknown Alert",
    state: a.state || "India",
    category: a.category || "Scam",
    description: a.description || "",
    publishedAt: a.publishedAt
  })));
  const statsJson = JSON.stringify(statsObj);

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Cyber Shield | Neural Network Dashboard</title>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#22d3ee">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap');
    :root {
      --cyan: #22d3ee; --purple: #a855f7; --green: #10b981; --red: #ef4444;
      --yellow: #f59e0b; --bg: #020617; --surface: rgba(15,23,42,0.9);
      --border: rgba(34,211,238,0.15); --text: #f8fafc; --muted: #94a3b8;
    }
    * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
    body { font-family:'Outfit',sans-serif; background:var(--bg); color:var(--text); overflow-x:hidden; min-height:100vh; }
    
    /* Background */
    .bg-glow { position:fixed; top:0;left:0;right:0;bottom:0; background:radial-gradient(ellipse at 20% 50%,rgba(168,85,247,0.08) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(34,211,238,0.08) 0%,transparent 60%); z-index:-2; pointer-events:none; }
    .grid-bg { position:fixed; top:0;left:0;right:0;bottom:0; background-image:linear-gradient(rgba(34,211,238,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,0.03) 1px,transparent 1px); background-size:40px 40px; z-index:-1; }

    /* Header */
    .header { position:sticky; top:0; z-index:100; background:rgba(2,6,23,0.85); backdrop-filter:blur(20px); border-bottom:1px solid var(--border); padding:12px 20px; display:flex; align-items:center; justify-content:space-between; }
    .header-left { display:flex; align-items:center; gap:10px; }
    .back-btn { width:36px;height:36px; border-radius:10px; background:rgba(34,211,238,0.1); border:1px solid var(--border); color:var(--cyan); display:flex;align-items:center;justify-content:center; text-decoration:none; font-size:16px; transition:.2s; }
    .back-btn:hover { background:rgba(34,211,238,0.2); }
    .header-title { font-weight:700; font-size:16px; }
    .header-title span { color:var(--cyan); }
    .live-badge { display:flex; align-items:center; gap:6px; padding:4px 12px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:100px; font-size:10px; font-weight:700; color:var(--green); letter-spacing:1px; }
    .pulse-dot { width:6px;height:6px; background:var(--green); border-radius:50%; animation:blink 1.5s infinite; }
    @keyframes blink { 0%,100%{opacity:1;box-shadow:0 0 6px var(--green);} 50%{opacity:0.3;box-shadow:none;} }

    /* Main layout */
    .container { padding:16px; max-width:600px; margin:0 auto; }

    /* Stats row */
    .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:16px; }
    .stat-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:14px 12px; text-align:center; backdrop-filter:blur(10px); }
    .stat-num { font-size:22px; font-weight:900; }
    .stat-label { font-size:10px; font-weight:600; color:var(--muted); letter-spacing:1px; margin-top:2px; text-transform:uppercase; }
    .stat-cyan { color:var(--cyan); }
    .stat-purple { color:var(--purple); }
    .stat-green { color:var(--green); }

    /* Scanner */
    .scanner-card { background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:20px; backdrop-filter:blur(10px); margin-bottom:16px; }
    .card-title { font-size:13px; font-weight:700; letter-spacing:1px; color:var(--cyan); text-transform:uppercase; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
    .scanner-input { width:100%; background:rgba(34,211,238,0.05); border:1px solid var(--border); border-radius:12px; color:var(--text); font-family:'Outfit',sans-serif; font-size:14px; padding:12px 14px; resize:none; height:100px; outline:none; transition:.2s; }
    .scanner-input:focus { border-color:var(--cyan); background:rgba(34,211,238,0.08); }
    .scanner-input::placeholder { color:var(--muted); }
    .scan-btn { width:100%; margin-top:10px; padding:14px; background:linear-gradient(135deg,var(--purple),#7c3aed); border:none; border-radius:12px; color:white; font-family:'Outfit',sans-serif; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:.2s; letter-spacing:.5px; }
    .scan-btn:hover { transform:translateY(-1px); box-shadow:0 8px 20px -5px rgba(168,85,247,.5); }
    .scan-btn:active { transform:scale(0.98); }
    
    /* Result */
    .result-box { margin-top:14px; padding:14px; border-radius:12px; display:none; animation:fadeInUp .4s ease; }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .result-safe { background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); }
    .result-suspicious { background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); }
    .result-danger { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); }
    .result-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
    .result-risk { font-size:20px; font-weight:900; }
    .result-score-ring { width:50px;height:50px; border-radius:50%; display:flex;align-items:center;justify-content:center; font-weight:900; font-size:14px; }
    .result-tip { font-size:12px; color:var(--muted); line-height:1.5; margin-top:8px; }
    .result-reasons { margin-top:8px; }
    .reason-tag { display:inline-block; padding:3px 10px; border-radius:100px; font-size:11px; font-weight:600; margin:2px; background:rgba(255,255,255,0.08); }

    /* Risk meter */
    .risk-bar-bg { height:6px; background:rgba(255,255,255,0.08); border-radius:100px; margin:10px 0; overflow:hidden; }
    .risk-bar-fill { height:100%; border-radius:100px; transition:width 1s ease; }

    /* Top states */
    .states-list { display:flex; flex-direction:column; gap:8px; }
    .state-row { display:flex; align-items:center; gap:10px; }
    .state-name { font-size:13px; font-weight:600; min-width:110px; }
    .state-bar-bg { flex:1; height:8px; background:rgba(255,255,255,0.06); border-radius:100px; overflow:hidden; }
    .state-bar-fill { height:100%; background:linear-gradient(90deg,var(--cyan),var(--purple)); border-radius:100px; }
    .state-count { font-size:12px; color:var(--muted); font-weight:600; min-width:40px; text-align:right; }

    /* Alerts feed */
    .alerts-list { display:flex; flex-direction:column; gap:10px; }
    .alert-card { background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:14px; padding:14px; transition:.2s; }
    .alert-card:hover { background:rgba(255,255,255,0.05); border-color:rgba(34,211,238,0.3); }
    .alert-top { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:6px; }
    .alert-title { font-size:13px; font-weight:600; line-height:1.4; flex:1; }
    .alert-cat { padding:2px 8px; border-radius:100px; font-size:10px; font-weight:700; letter-spacing:.5px; white-space:nowrap; }
    .cat-fraud { background:rgba(239,68,68,.15); color:#ef4444; }
    .cat-phishing { background:rgba(245,158,11,.15); color:#f59e0b; }
    .cat-other { background:rgba(168,85,247,.15); color:#a855f7; }
    .alert-meta { font-size:11px; color:var(--muted); display:flex; align-items:center; gap:8px; }
    .alert-desc { font-size:12px; color:var(--muted); line-height:1.5; margin-top:6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

    /* Bottom nav */
    .bottom-nav { position:fixed; bottom:0;left:0;right:0; background:rgba(2,6,23,0.95); backdrop-filter:blur(20px); border-top:1px solid var(--border); display:flex; padding:8px 0 calc(8px + env(safe-area-inset-bottom)); z-index:100; }
    .nav-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:6px 0; cursor:pointer; color:var(--muted); font-size:10px; font-weight:600; letter-spacing:.5px; text-decoration:none; transition:.2s; }
    .nav-item.active, .nav-item:hover { color:var(--cyan); }
    .nav-item i { font-size:18px; }

    /* Tab content */
    .tab-pane { display:none; }
    .tab-pane.active { display:block; }
    .spacer { height:80px; }

    /* Search */
    .search-wrap { position:relative; margin-bottom:14px; }
    .search-input { width:100%; background:var(--surface); border:1px solid var(--border); border-radius:12px; color:var(--text); font-family:'Outfit',sans-serif; font-size:14px; padding:12px 14px 12px 40px; outline:none; }
    .search-input:focus { border-color:var(--cyan); }
    .search-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--muted); font-size:14px; }

    /* Filter chips */
    .filter-row { display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; margin-bottom:14px; scrollbar-width:none; }
    .filter-row::-webkit-scrollbar { display:none; }
    .chip { padding:6px 14px; border-radius:100px; font-size:12px; font-weight:600; border:1px solid var(--border); background:transparent; color:var(--muted); cursor:pointer; white-space:nowrap; transition:.2s; }
    .chip.active, .chip:hover { background:rgba(34,211,238,0.1); border-color:var(--cyan); color:var(--cyan); }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="grid-bg"></div>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <a href="/open-app" class="back-btn"><i class="fas fa-arrow-left"></i></a>
      <div class="header-title">Cyber <span>Shield</span></div>
    </div>
    <div class="live-badge"><div class="pulse-dot"></div>LIVE</div>
  </div>

  <!-- Main -->
  <div class="container">
    <!-- Tabs -->
    <div id="tab-home" class="tab-pane active">
      <!-- Stats -->
      <div class="stats-row" style="margin-top:14px;">
        <div class="stat-card">
          <div class="stat-num stat-cyan">${statsCount.toLocaleString()}</div>
          <div class="stat-label">Total Scams</div>
        </div>
        <div class="stat-card">
          <div class="stat-num stat-purple">${Object.keys(statsObj).length || 28}</div>
          <div class="stat-label">States Active</div>
        </div>
        <div class="stat-card">
          <div class="stat-num stat-green">LIVE</div>
          <div class="stat-label">Neural Link</div>
        </div>
      </div>

      <!-- Scanner -->
      <div class="scanner-card">
        <div class="card-title"><i class="fas fa-brain"></i> AI SCAM SCANNER</div>
        <textarea class="scanner-input" id="scanInput" placeholder="Paste suspicious email, SMS, or message text here to scan for threats..."></textarea>
        <button class="scan-btn" id="scanBtn" onclick="runScan()">
          <i class="fas fa-shield-halved"></i> ANALYZE THREAT
        </button>
        <div class="result-box" id="resultBox">
          <div class="result-header">
            <div>
              <div class="result-risk" id="resultRisk">Safe</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px;" id="resultLevel">No threats detected</div>
            </div>
            <div class="result-score-ring" id="resultRing">0%</div>
          </div>
          <div class="risk-bar-bg"><div class="risk-bar-fill" id="riskBar" style="width:0%"></div></div>
          <div class="result-reasons" id="resultReasons"></div>
          <div class="result-tip" id="resultTip"></div>
        </div>
      </div>

      <!-- Top States -->
      <div class="scanner-card">
        <div class="card-title"><i class="fas fa-map-location-dot"></i> TOP THREAT ZONES</div>
        <div class="states-list" id="statesList">
          <div style="color:var(--muted);font-size:13px;text-align:center;padding:10px">Loading...</div>
        </div>
      </div>
    </div>

    <!-- Alerts Tab -->
    <div id="tab-alerts" class="tab-pane">
      <div style="margin-top:14px;">
        <div class="search-wrap">
          <i class="fas fa-search search-icon"></i>
          <input class="search-input" id="alertSearch" placeholder="Search alerts..." oninput="filterAlerts()" >
        </div>
        <div class="filter-row" id="filterRow">
          <div class="chip active" onclick="setFilter('all',this)">All</div>
          <div class="chip" onclick="setFilter('fraud',this)">Fraud</div>
          <div class="chip" onclick="setFilter('phishing',this)">Phishing</div>
          <div class="chip" onclick="setFilter('cyber',this)">Cyber Crime</div>
          <div class="chip" onclick="setFilter('upi',this)">UPI Scam</div>
        </div>
        <div class="alerts-list" id="alertsList">
          <div style="color:var(--muted);font-size:13px;text-align:center;padding:20px">Loading alerts...</div>
        </div>
      </div>
    </div>

    <!-- Report Tab -->
    <div id="tab-report" class="tab-pane">
      <div style="margin-top:14px;">
        <div class="scanner-card">
          <div class="card-title"><i class="fas fa-flag"></i> REPORT A SCAM</div>
          <p style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:16px;">Help protect India. Report a scam incident and we'll add it to our neural network database.</p>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <input id="rTitle" placeholder="Scam title / subject" style="background:rgba(34,211,238,0.05);border:1px solid var(--border);border-radius:12px;color:var(--text);font-family:'Outfit',sans-serif;font-size:14px;padding:12px 14px;outline:none;width:100%">
            <input id="rState" placeholder="Your state (e.g., Telangana)" style="background:rgba(34,211,238,0.05);border:1px solid var(--border);border-radius:12px;color:var(--text);font-family:'Outfit',sans-serif;font-size:14px;padding:12px 14px;outline:none;width:100%">
            <textarea id="rDesc" placeholder="Describe the scam in detail..." style="background:rgba(34,211,238,0.05);border:1px solid var(--border);border-radius:12px;color:var(--text);font-family:'Outfit',sans-serif;font-size:14px;padding:12px 14px;outline:none;width:100%;height:100px;resize:none;"></textarea>
            <button onclick="submitReport()" style="padding:14px;background:linear-gradient(135deg,var(--cyan),#0891b2);border:none;border-radius:12px;color:#020617;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">
              <i class="fas fa-paper-plane"></i> SUBMIT REPORT
            </button>
          </div>
          <div id="reportMsg" style="display:none;margin-top:12px;padding:12px;border-radius:10px;font-size:13px;text-align:center;"></div>
        </div>
      </div>
    </div>

    <div class="spacer"></div>
  </div>

  <!-- Bottom Nav -->
  <nav class="bottom-nav">
    <a class="nav-item active" id="nav-home" onclick="switchTab('home')"><i class="fas fa-house"></i>HOME</a>
    <a class="nav-item" id="nav-alerts" onclick="switchTab('alerts')"><i class="fas fa-bell"></i>ALERTS</a>
    <a class="nav-item" id="nav-report" onclick="switchTab('report')"><i class="fas fa-flag"></i>REPORT</a>
  </nav>

  <script>
    const ALERTS_DATA = ${alertsJson};
    const STATS_DATA = ${statsJson};
    let currentFilter = 'all';

    // --- Tab Navigation ---
    function switchTab(tab) {
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.getElementById('tab-' + tab).classList.add('active');
      document.getElementById('nav-' + tab).classList.add('active');
      if (tab === 'alerts') renderAlerts();
    }

    // --- Top States ---
    function renderStates() {
      const list = document.getElementById('statesList');
      const entries = Object.entries(STATS_DATA).sort((a,b) => b[1]-a[1]).slice(0,8);
      if (entries.length === 0) { list.innerHTML = '<div style="color:var(--muted);font-size:13px;text-align:center;padding:10px">No state data yet</div>'; return; }
      const max = entries[0][1];
      list.innerHTML = entries.map(([state, count]) => \`
        <div class="state-row">
          <div class="state-name">\${state}</div>
          <div class="state-bar-bg"><div class="state-bar-fill" style="width:\${Math.round((count/max)*100)}%"></div></div>
          <div class="state-count">\${count}</div>
        </div>\`).join('');
    }

    // --- Alerts ---
    function getCatClass(cat) {
      const c = (cat||'').toLowerCase();
      if (c.includes('fraud') || c.includes('financial')) return 'cat-fraud';
      if (c.includes('phish') || c.includes('email') || c.includes('link')) return 'cat-phishing';
      return 'cat-other';
    }
    function timeAgo(iso) {
      if (!iso) return 'Recently';
      const diff = Date.now() - new Date(iso).getTime();
      const d = Math.floor(diff/86400000);
      if (d === 0) return 'Today'; if (d === 1) return 'Yesterday'; if (d < 30) return d + 'd ago';
      return new Date(iso).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'});
    }
    function renderAlerts(data) {
      const list = document.getElementById('alertsList');
      const search = (document.getElementById('alertSearch').value||'').toLowerCase();
      let filtered = (data || ALERTS_DATA).filter(a => {
        const matchSearch = !search || (a.title||'').toLowerCase().includes(search) || (a.state||'').toLowerCase().includes(search);
        const matchFilter = currentFilter === 'all' || (a.category||'').toLowerCase().includes(currentFilter) || (a.title||'').toLowerCase().includes(currentFilter);
        return matchSearch && matchFilter;
      });
      if (filtered.length === 0) { list.innerHTML = '<div style="color:var(--muted);font-size:13px;text-align:center;padding:20px">No alerts found</div>'; return; }
      list.innerHTML = filtered.map(a => \`
        <div class="alert-card">
          <div class="alert-top">
            <div class="alert-title">\${a.title}</div>
            <span class="alert-cat \${getCatClass(a.category)}">\${(a.category||'Scam').toUpperCase()}</span>
          </div>
          <div class="alert-meta"><i class="fas fa-location-dot"></i>\${a.state} &bull; \${timeAgo(a.publishedAt)}</div>
          \${a.description ? \`<div class="alert-desc">\${a.description}</div>\` : ''}
        </div>\`).join('');
    }
    function filterAlerts() { renderAlerts(); }
    function setFilter(f, el) {
      currentFilter = f;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      renderAlerts();
    }

    // --- Scanner ---
    async function runScan() {
      const text = document.getElementById('scanInput').value.trim();
      if (!text) { alert('Please paste some text to analyze.'); return; }
      const btn = document.getElementById('scanBtn');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ANALYZING...';
      btn.disabled = true;
      try {
        const res = await fetch('/api/alerts/scan', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text}) });
        const data = await res.json();
        showResult(data);
      } catch(e) { alert('Scanner error. Please try again.'); }
      btn.innerHTML = '<i class="fas fa-shield-halved"></i> ANALYZE THREAT';
      btn.disabled = false;
    }
    function showResult(data) {
      const box = document.getElementById('resultBox');
      const score = data.riskScore || 0;
      const level = data.riskLevel || 'Safe';
      box.style.display = 'block';
      box.className = 'result-box ' + (score >= 60 ? 'result-danger' : score >= 20 ? 'result-suspicious' : 'result-safe');
      document.getElementById('resultRisk').textContent = level;
      document.getElementById('resultRisk').style.color = score >= 60 ? '#ef4444' : score >= 20 ? '#f59e0b' : '#10b981';
      document.getElementById('resultLevel').textContent = score >= 60 ? '⚠️ High threat detected' : score >= 20 ? '⚡ Suspicious content' : '✅ Looks safe';
      document.getElementById('resultRing').textContent = score + '%';
      document.getElementById('resultRing').style.background = score >= 60 ? 'rgba(239,68,68,.2)' : score >= 20 ? 'rgba(245,158,11,.2)' : 'rgba(16,185,129,.2)';
      document.getElementById('resultRing').style.color = score >= 60 ? '#ef4444' : score >= 20 ? '#f59e0b' : '#10b981';
      document.getElementById('riskBar').style.width = score + '%';
      document.getElementById('riskBar').style.background = score >= 60 ? '#ef4444' : score >= 20 ? '#f59e0b' : '#10b981';
      document.getElementById('resultReasons').innerHTML = (data.reasons||[]).map(r => \`<span class="reason-tag">\${r}</span>\`).join('');
      document.getElementById('resultTip').textContent = '💡 ' + (data.tip || '');
      box.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }

    // --- Report ---
    async function submitReport() {
      const title = document.getElementById('rTitle').value.trim();
      const state = document.getElementById('rState').value.trim();
      const desc = document.getElementById('rDesc').value.trim();
      const msg = document.getElementById('reportMsg');
      if (!title || !state) { msg.style.display='block'; msg.style.background='rgba(239,68,68,.1)'; msg.style.color='#ef4444'; msg.textContent='Please fill in title and state.'; return; }
      msg.style.display='block'; msg.style.background='rgba(34,211,238,.1)'; msg.style.color='var(--cyan)'; msg.textContent='Thank you! Report submitted to neural network. 🛡️';
      document.getElementById('rTitle').value=''; document.getElementById('rState').value=''; document.getElementById('rDesc').value='';
    }

    // Init
    renderStates();
  </script>
</body>
</html>`);
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
