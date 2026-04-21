# Email Scam Shield

🛡️ **Email Scam Shield** is a cybersecurity-themed mobile application built with React Native and Expo. It empowers users to detect phishing and scam emails through AI-powered scanning, interactive education, and gamification.

## 🌟 App Overview

A full-featured cyberpunk-themed mobile app giving you the tools to stay safe online:
- **Animated Splash Screen** with a sleek cyber shield.
- **5-Panel Swipeable Dashboard** for seamless navigation (powered by `react-native-pager-view`).
- **Real-time Notification Protection Toggle** to alert you of potential threats.
- **Manual Email Scanner** with advanced scam detection logic.
- **India State Scam Alerts** using interactive flip flashcards to learn state-specific scam trends.
- **Cyber Runner Educational Game** with 10 challenging levels.
- **Achievement/Badge Profile System** to track your learning progress.
- **Multi-Language Support (Localization)** with dynamic on-the-fly language switching (including English, Telugu, and RTL support readiness).

---

## 🏗️ Architecture

### Frontend (Expo React Native)
- **Framework**: Expo SDK with React Native
- **Routing**: Expo Router with file-based routing
- **Navigation**: `react-native-pager-view` for horizontal swipeable dashboards
- **State Management**: React Context (`ProfileContext` & Language Providers) + `AsyncStorage` for persistence
- **Animations**: React Native Animated API for dynamic visual feedback
- **Icons**: `@expo/vector-icons` (Ionicons, MaterialCommunityIcons)
- **Localization**: Custom i18n implementation with translation files.

### Backend (Express)
- Simple Express server for serving API endpoints and static resources.

---

## 🎨 Design Theme

**Cyberpunk / Cybersecurity aesthetic**
- **Background**: `#0F172A` (deep navy)
- **Cyan Accent**: `#22D3EE`
- **Electric Blue**: `#3B82F6`
- **Purple Glow**: `#A855F7`
- **UI Elements**: Neon borders, glowing buttons, pulsing animations, and dark-mode glassmorphism.

---

## 🚀 Key Features

### 🔍 Email Scanner
- Keyword-based phishing detection (urgent language, suspicious domains, brand spoofing).
- Lookalike domain detection (e.g., PayPaI, Arnazon).
- Risk level assessment: Safe / Suspicious / High Risk with an animated visual risk meter.

### 🗺️ Scam Alerts Map
- Interactive map covering Indian states.
- Pre-loaded scam data describing major localized threats.
- Flip card interaction to reveal prevention tips.
- Animated state transitions.

### 🕹️ Cyber Runner Game
- 4 unique avatar choices (Cyber Ninja, AI Guardian, Security Hacker, Tech Robot).
- 10 progressive levels (Beginner → Intermediate → Advanced).
- Score-based ranking system: *Cyber Defender*, *Scam Spotter*, *Beginner*, *Needs Training*.
- 100 gate message pairs teaching safe vs. scam distinction.

### 🏆 Profile & Badges
- 8 unlockable achievement badges based on user actions.
- Persistent stats tracking: emails scanned, scams detected, game scores, and current level.

### 🌐 Localization & Language Support
- Fully translated UI components.
- Easily toggleable language settings from the app (Supports English & Telugu).

---

## 📂 File Structure Overview

```text
Email-Scam-Shield/
├── app/                  # Expo Router layout and entry points
├── screens/              # Core dashboard screens (Scanner, Game, Profile, Map)
├── components/           # Reusable UI components (GlowButton, CyberCard, RiskMeter)
├── context/              # Context providers (Profile & Localization context)
├── data/                 # Game data, Scam datasets
├── services/             # Core logic (scanService.ts)
├── constants/            # Theme colors, styling constants, translation files
├── server/               # Express backend
└── package.json          # Project configurations and scripts
```

---

## 💻 Running the Project

### Prerequisites
Make sure you have Node.js and npm installed on your device. You'll also need the Expo Go app on your physical device or a mobile emulator.

### Initial Setup
At the root directory, install the project dependencies:
```bash
npm install
# or inside the workspace:
cd Email-Scam-Shield && npm install
```

### Start the Application
From the root workspace, you can use the predefined helper scripts:

**1. Start the React Native (Expo) Frontend:**
```bash
npm run start
```
*This will launch the Expo bundler (typically on port 8081). Scan the QR code using Expo Go on your mobile device.*

**2. Start the Backend Server (Optional):**
```bash
npm run server
```
*This starts the Express server (typically on port 5000).*

---

## 📦 Key Packages
- `react-native-pager-view`: Swipeable dashboard pages.
- `react-native-maps`: Mapping capabilities.
- `expo-glass-effect`: Glassmorphism visuals.
- `expo-router`: File-based routing for React Native.
