import * as Linking from "expo-linking";
import { Platform } from "react-native";

/**
 * App Specific Links & Metadata
 * Production backend hosted on Render.com
 */
const BACKEND_URL = "https://cyber-shield-api.onrender.com";

export const APP_LINKS = {
  // Direct APK download link from backend (Robust endpoint)
  DOWNLOAD_URL: `${BACKEND_URL}/download-apk`,
  
  // Backend Landing Page - Now at the ROOT for easier mobile browser searching
  WEB_LANDING_URL: `${BACKEND_URL}/`,
  
  // App Store Link (Placeholder)
  PLAY_STORE_URL: "https://play.google.com/store/apps/details?id=com.cyber.scamshield",
  
  // The base message used when sharing the app
  SHARE_MESSAGE: "🛡️ Stay safe from phishing! I'm using Cyber Shield to scan my emails for scams. Join the protection network:",
  
  // Internal System Scheme (Requires app to be installed)
  APP_SCHEME: "emailscamshield://",

  /**
   * Returns a deep link for the current environment
   */
  getDeepLink: () => Linking.createURL(""),

  /**
   * Returns the most appropriate URL to share based on environment
   */
  getShareUrl: () => {
    return APP_LINKS.WEB_LANDING_URL;
  }
};
