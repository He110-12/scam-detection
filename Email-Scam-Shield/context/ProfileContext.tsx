import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations } from "@/constants/translations";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  text: string;
  result: {
    riskLevel: "Safe" | "Suspicious" | "High Risk";
    riskScore: number;
    reasons: string[];
  };
}

export type ProfileType = "Personal" | "Business" | "Family";

export interface UserProfile {
  emailsScanned: number;
  scamsDetected: number;
  gameScore: number;
  levelsCompleted: number;
  selectedAvatar: string;
  customAvatar?: string;
  protectionEnabled: boolean;
  language: string;
  badges: Badge[];
  isDarkMode: boolean;
  profileType: ProfileType;
  scanHistory: ScanHistoryItem[];
  backendMode: "local" | "remote" | "auto";
  backendUrl: string;
}

const DEFAULT_BADGES: Badge[] = [
  { id: "first_scan", name: "First Shield", description: "Scanned your first email", icon: "🛡️", earned: false },
  { id: "scam_hunter", name: "Scam Hunter", description: "Detected 5 scam emails", icon: "🎯", earned: false },
  { id: "cyber_defender", name: "Cyber Defender", description: "Score 90+ in a game level", icon: "⚡", earned: false },
  { id: "phishing_expert", name: "Phishing Expert", description: "Detected 10 scam emails", icon: "🐟", earned: false },
  { id: "protection_on", name: "Guardian Mode", description: "Enabled notification protection", icon: "🔒", earned: false },
  { id: "level5", name: "Level Master", description: "Completed 5 game levels", icon: "🏆", earned: false },
  { id: "perfect_game", name: "Perfect Run", description: "Score 100 in any game level", icon: "💎", earned: false },
  { id: "explorer", name: "State Explorer", description: "Viewed scam alerts from 3 states", icon: "🗺️", earned: false },
];

const DEFAULT_PROFILE: UserProfile = {
  emailsScanned: 0,
  scamsDetected: 0,
  gameScore: 0,
  levelsCompleted: 0,
  selectedAvatar: "ninja",
  protectionEnabled: false,
  language: "English",
  badges: DEFAULT_BADGES,
  isDarkMode: true,
  profileType: "Personal",
  scanHistory: [],
  backendMode: "local",
  backendUrl: "http://192.168.137.1:5000",
};

interface ProfileContextType {
  profile: UserProfile;
  incrementScans: (isScam: boolean) => void;
  addScanResult: (text: string, result: any) => void;
  updateGameScore: (score: number, levelCompleted: boolean) => void;
  setAvatar: (id: string) => void;
  setCustomAvatar: (uri: string | undefined) => void;
  toggleProtection: () => void;
  earnBadge: (id: string) => void;
  statesViewed: string[];
  addStateViewed: (state: string) => void;
  setLanguage: (lang: string) => void;
  setBackendConfig: (mode: "local" | "remote" | "auto", url: string) => void;
  toggleTheme: () => void;
  setProfileType: (type: ProfileType) => void;
  t: (key: string) => string;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

const STORAGE_KEY = "@email_scam_shield_profile";
const STATES_KEY = "@email_scam_shield_states";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [statesViewed, setStatesViewed] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const storedStates = await AsyncStorage.getItem(STATES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile(prev => ({ ...prev, ...parsed }));
        }
        if (storedStates) setStatesViewed(JSON.parse(storedStates));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const saveProfile = async (p: UserProfile) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
  };

  const earnBadge = (id: string) => {
    setProfile(prev => {
      const updated = {
        ...prev,
        badges: (prev.badges || DEFAULT_BADGES).map(b =>
          b.id === id && !b.earned
            ? { ...b, earned: true, earnedDate: new Date().toLocaleDateString("en-IN") }
            : b
        )
      };
      saveProfile(updated);
      return updated;
    });
  };

  const incrementScans = (isScam: boolean) => {
    setProfile(prev => {
      const newScans = prev.emailsScanned + 1;
      const newDetected = prev.scamsDetected + (isScam ? 1 : 0);
      const updated = { ...prev, emailsScanned: newScans, scamsDetected: newDetected };
      saveProfile(updated);

      if (newScans === 1) earnBadge("first_scan");
      if (newDetected >= 5) earnBadge("scam_hunter");
      if (newDetected >= 10) earnBadge("phishing_expert");

      return updated;
    });
  };

  const addScanResult = (text: string, result: any) => {
    setProfile(prev => {
      const newItem: ScanHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString("en-IN"),
        text,
        result,
      };
      
      const newScans = prev.emailsScanned + 1;
      const isScam = result.riskLevel === "High Risk";
      const newDetected = prev.scamsDetected + (isScam ? 1 : 0);
      
      const updated = { 
        ...prev, 
        emailsScanned: newScans, 
        scamsDetected: newDetected,
        scanHistory: [newItem, ...(prev.scanHistory || [])].slice(0, 20) // Keep last 20 safely
      };
      
      saveProfile(updated);

      if (newScans === 1) earnBadge("first_scan");
      if (newDetected >= 5) earnBadge("scam_hunter");
      if (newDetected >= 10) earnBadge("phishing_expert");

      return updated;
    });
  };

  const updateGameScore = (score: number, levelCompleted: boolean) => {
    setProfile(prev => {
      const newBest = Math.max(prev.gameScore, score);
      const newLevels = levelCompleted ? prev.levelsCompleted + 1 : prev.levelsCompleted;
      const updated = { ...prev, gameScore: newBest, levelsCompleted: newLevels };
      saveProfile(updated);

      if (score >= 90) earnBadge("cyber_defender");
      if (score >= 100) earnBadge("perfect_game");
      if (newLevels >= 5) earnBadge("level5");

      return updated;
    });
  };

  const setAvatar = (id: string) => {
    setProfile(prev => {
      const updated = { ...prev, selectedAvatar: id };
      saveProfile(updated);
      return updated;
    });
  };

  const setCustomAvatar = (uri: string | undefined) => {
    setProfile(prev => {
      const updated = { ...prev, customAvatar: uri };
      saveProfile(updated);
      return updated;
    });
  };

  const toggleProtection = () => {
    setProfile(prev => {
      const updated = { ...prev, protectionEnabled: !prev.protectionEnabled };
      saveProfile(updated);
      if (!prev.protectionEnabled) earnBadge("protection_on");
      return updated;
    });
  };

  const addStateViewed = async (state: string) => {
    if (statesViewed.includes(state)) return;
    const updated = [...statesViewed, state];
    setStatesViewed(updated);
    try { await AsyncStorage.setItem(STATES_KEY, JSON.stringify(updated)); } catch {}
    if (updated.length >= 3) earnBadge("explorer");
  };

  const setLanguage = (lang: string) => {
    setProfile(prev => {
      const updated = { ...prev, language: lang };
      saveProfile(updated);
      return updated;
    });
  };

  const setBackendConfig = (mode: "local" | "remote" | "auto", url: string) => {
    setProfile(prev => {
      const updated = { ...prev, backendMode: mode, backendUrl: url };
      saveProfile(updated);
      return updated;
    });
  };

  const toggleTheme = () => {
    setProfile(prev => {
      const updated = { ...prev, isDarkMode: !prev.isDarkMode };
      saveProfile(updated);
      return updated;
    });
  };

  const setProfileType = (type: ProfileType) => {
    setProfile(prev => {
      const updated = { ...prev, profileType: type };
      saveProfile(updated);
      return updated;
    });
  };

  const t = (key: string) => {
    const lang = profile.language || "English";
    return translations[lang]?.[key] || translations["English"]?.[key] || key;
  };

  if (!loaded) return null;

  return (
    <ProfileContext.Provider value={{
      profile, incrementScans, addScanResult, updateGameScore, setAvatar, setCustomAvatar,
      toggleProtection, earnBadge, statesViewed, addStateViewed,
      setLanguage, setBackendConfig, toggleTheme, setProfileType, t,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
