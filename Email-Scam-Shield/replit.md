# Email Scam Shield

A cybersecurity-themed mobile application built with React Native Expo that helps users detect phishing and scam emails through AI-powered scanning, education, and gamification.

## App Overview

**Email Scam Shield** — a full-featured cyberpunk-themed mobile app with:
- Animated splash screen with cyber shield
- 5-panel swipeable dashboard navigation (PagerView)
- Real-time notification protection toggle
- Manual email scanner with scam detection logic
- India state scam alerts with flip flashcards
- Cyber runner educational game (10 levels)
- Achievement/badge profile system

## Architecture

### Frontend (Expo React Native)
- **Framework**: Expo SDK with React Native
- **Routing**: Expo Router with file-based routing
- **Navigation**: react-native-pager-view for horizontal swipeable dashboards
- **State**: React Context (ProfileContext) + AsyncStorage for persistence
- **Animations**: React Native Animated API
- **Icons**: @expo/vector-icons (Ionicons, MaterialCommunityIcons)

### Backend (Express)
- Simple Express server serving API endpoints and static files
- Port: 5000

## File Structure

```
app/
  _layout.tsx          # Root layout with providers
  index.tsx            # Animated splash screen
  main.tsx             # Main swipeable dashboard container
screens/
  ProtectionDashboard.tsx  # Dashboard 1 - Notification protection
  EmailScanner.tsx         # Dashboard 2 - Manual email scanning
  ScamAlertsMap.tsx        # Dashboard 3 - India state scam alerts
  CyberRunnerGame.tsx      # Dashboard 4 - Phishing detection game
  ProfileDashboard.tsx     # Dashboard 5 - User profile & badges
components/
  cyber/
    GlowButton.tsx         # Animated glowing button
    CyberCard.tsx          # Neon border card component
    RiskMeter.tsx          # Risk level indicator with animation
  ErrorBoundary.tsx        # Error boundary wrapper
  ErrorFallback.tsx        # Error fallback UI
context/
  ProfileContext.tsx        # User profile, stats, badges state
data/
  scamData.ts              # India state scam alerts dataset
  gameData.ts              # Game levels, gate messages, avatars
services/
  scanService.ts           # Email scam detection logic
constants/
  colors.ts                # Cyber theme colors
server/
  index.ts                 # Express server
  routes.ts                # API routes
```

## Design Theme

**Cyberpunk / Cybersecurity aesthetic**
- Background: `#0F172A` (deep navy)
- Cyan accent: `#22D3EE`
- Electric blue: `#3B82F6`
- Purple glow: `#A855F7`
- Neon borders, glowing buttons, pulsing animations

## Key Features

### Email Scanner
- Keyword-based phishing detection (urgent language, suspicious domains, brand spoofing)
- Lookalike domain detection (PayPaI, Arnazon, etc.)
- Risk level: Safe / Suspicious / High Risk with animated meter

### Scam Alerts Map
- 30 Indian states selectable
- Pre-loaded scam data for major states
- Flip card interaction to reveal prevention tips
- Animated state transitions

### Cyber Runner Game
- 4 avatar choices (Cyber Ninja, AI Guardian, Security Hacker, Tech Robot)
- 10 levels (Beginner → Intermediate → Advanced)
- 100 gate message pairs (safe vs scam)
- Score-based ranking: Cyber Defender / Scam Spotter / Beginner / Needs Training

### Profile & Badges
- 8 achievement badges (earned by completing actions)
- Persistent stats: emails scanned, scams detected, game scores, levels
- AsyncStorage persistence

## Running the App

- **Frontend**: `npm run expo:dev` (port 8081)
- **Backend**: `npm run server:dev` (port 5000)

## Packages Added
- `react-native-pager-view` — swipeable dashboard pages
- `react-native-maps@1.18.0` — maps (installed but India map uses grid/SVG approach)
