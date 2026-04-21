# Email Scam Shield - Technical Documentation

This document provides in-depth technical details on the architecture, file structure, state management, and local development setup for the **Email Scam Shield** mobile application.

---

## 🏗️ Architecture Stack

### Frontend Mobile Application
- **Framework**: Expo SDK (React Native)
- **Routing**: Expo Router (`app/` directory based file routing)
- **Navigation Model**: Horizontal Swipeable Dashboards via `react-native-pager-view`
- **UI & Styling**: custom StyleSheet API objects, inline neon themes, and custom glowing components. Icons via `@expo/vector-icons`.
- **Animations**: React Native's Native `Animated` API for performant visual feedback (risk meters, transitions).
- **Persistent Storage**: `AsyncStorage` for saving user profiles, badges, language preferences, and game progression locally.

### Backend Services
- **Framework**: Express.js (Node.js)
- **Purpose**: Designed to serve API endpoints for advanced scanning logic or remote asset delivery.
- **Port**: Defaults to `5000`.

---

## 📂 Detailed File Structure

```text
Email-Scam-Shield/
├── app/                        # Expo Router entry points
│   ├── _layout.tsx             # Root layout wrapping all providers (Theme, Profile, i18n)
│   ├── index.tsx               # Animated entry splash screen 
│   └── main.tsx                # Main container integrating the PagerView for the 5 dashboards
│
├── screens/                    # Core Application Views
│   ├── ProtectionDashboard.tsx # Dash 1: Status & Toggles
│   ├── EmailScanner.tsx        # Dash 2: Input scanning & animated risk meter
│   ├── ScamAlertsMap.tsx       # Dash 3: State selection & flip-card UI
│   ├── CyberRunnerGame.tsx     # Dash 4: Gamified phishing detection logic
│   └── ProfileDashboard.tsx    # Dash 5: Badges, stats, and settings (Localization)
│
├── components/                 # Reusable UI Elements
│   ├── cyber/
│   │   ├── GlowButton.tsx      # Core interactive button with animated shadow/glow
│   │   ├── CyberCard.tsx       # Container with neon borders
│   │   └── RiskMeter.tsx       # Animated visual gauge for scan results
│   ├── ErrorBoundary.tsx       # React Error Boundary for crash prevention
│   └── ErrorFallback.tsx       # Safe fallback UI component
│
├── context/                    # Global State Management
│   └── ProfileContext.tsx      # Manages user stats, game history, unlocked badges & syncs with AsyncStorage
│
├── data/                       # Static Content & Datasets
│   ├── scamData.ts             # JSON/Object structure mapping Indian states to local scams
│   └── gameData.ts             # Level configurations, gate messages (Safe vs Scam arrays), avatar definitions
│
├── services/                   # Application Logic
│   └── scanService.ts          # Core service interpreting text inputs against phishing heuristics/keywords
│
├── constants/                  # Configuration & Theming
│   ├── colors.ts               # Centralized cyber theme hex codes
│   └── translations.ts         # i18n dictionaries mapping keys to English, Telugu, etc.
│
├── server/                     # Backend API
│   ├── index.ts                # Express server initialization
│   └── routes.ts               # Endpoint definitions
│
└── package.json                # Defines React Native, Expo, and UI dependencies
```

---

## ⚙️ Core Modules Breakdown

### 1. `scanService.ts`
The brain of the manual scanner. 
- Performs regex matching against common urgency keywords (`urgent`, `immediate action required`, `account suspended`).
- Checks for known spoofed domains and lookalike characters (homoglyph attacks).
- Returns a structured object: `{ riskLevel: 'Safe' | 'Suspicious' | 'High Risk', reasons: string[], score: number }`.

### 2. `ProfileContext.tsx`
Handles the gamification state.
- Exposes `ProfileState` containing integers for `emailsScanned`, `scamsDetected`, and an array of `unlockedBadges`.
- Provides mutator functions like `incrementScans()`, `unlockBadge(badgeId)`, and `updateGameScore(score)`.
- Automatically persists updates to `AsyncStorage` using a `useEffect` hook listening to state changes.

### 3. Localization Implementation
- **Dictionaries**: Located in `constants/translations.ts`.
- **Mechanism**: A custom hook or Context provider (`LanguageContext`) determines the active locale. Components use a `t('key')` function to retrieve the current string.
- **Switching**: Triggered from the `ProfileDashboard`, which updates the global state and triggers a re-render of text nodes.

---

## 🚀 Development & Deployment Guide

### Environment Setup
1. Ensure Node.js (v18+) is installed.
2. Install dependencies via `npm install` at the workspace root.
3. Install the **Expo Go** app on your iOS/Android device for physical testing.

### Running the System
The workspace is configured with high-level scripts in the root `package.json`.

**Start the Frontend:**
```bash
npm run start
```
This boots the Metro bundler. Scan the resulting QR code in your terminal with Expo Go (Android) or the native Camera app (iOS) to launch the app.

**Start the Local API Server:**
```bash
npm run server
```

### Adding New Languages
To add a new language (e.g., Hindi):
1. Open `constants/translations.ts`.
2. Add a new object key (e.g., `hi`) mirroring the schema of `en`.
3. Translate all string values.
4. Update the `ProfileDashboard.tsx` settings toggle to include the new language option.

### Adding New Scam Data
To update state-specific threats:
1. Open `data/scamData.ts`.
2. Locate the target state in the array/object.
3. Add new objects to the `scams` array containing `{ title, description, prevention }`.

---
*For a high-level overview of the application's features and value, refer to `overview.md`.*
