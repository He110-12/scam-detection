import React, { useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, Animated, useWindowDimensions,
  ScrollView, Platform, TouchableOpacity, StatusBar, Share, Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import Colors from "@/constants/colors";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProtectionDashboard from "@/screens/ProtectionDashboard";
import EmailScanner from "@/screens/EmailScanner";
import CyberRunnerGame from "@/screens/CyberRunnerGame";
import ProfileDashboard from "@/screens/ProfileDashboard";
import ScamAlertsDashboard from "@/screens/ScamAlertsDashboard";
import AnimatedBackground from "@/components/cyber/AnimatedBackground";
import Logo from "@/components/cyber/Logo";
import { useProfile } from "@/context/ProfileContext";
import { APP_LINKS } from "@/constants/links";

const TABS = [
  { id: 0, key: "tabShield", icon: "shield-checkmark-outline", activeIcon: "shield-checkmark" },
  { id: 1, key: "tabScanner", icon: "scan-outline", activeIcon: "scan" },
  { id: 2, key: "tabAlerts", icon: "alert-circle-outline", activeIcon: "alert-circle" },
  { id: 3, key: "tabGame", icon: "game-controller-outline", activeIcon: "game-controller" },
  { id: 4, key: "tabProfile", icon: "person-circle-outline", activeIcon: "person-circle" },
] as const;

const SCREEN_TITLE_KEYS = [
  "protectionTitle",
  "scannerTitle",
  "dashboardTitle",
  "runnerTitle",
  "tabProfile",
];

export default function MainDashboard() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { t, profile, toggleTheme } = useProfile();
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const theme = profile.isDarkMode ? Colors.dark : Colors.light;

  const [hasDownloaded, setHasDownloaded] = useState(false);

  const fetchDownloadStatus = useCallback(async () => {
    try {
      const savedStatus = await AsyncStorage.getItem('HAS_DOWNLOADED_APP');
      if (savedStatus === 'true') setHasDownloaded(true);
    } catch (e) {
      console.warn("AsyncStorage error:", e);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    const downloadUrl = APP_LINKS.DOWNLOAD_URL;
    try {
      if (Platform.OS === 'web') {
        window.open(downloadUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(downloadUrl);
      }
      
      await AsyncStorage.setItem('HAS_DOWNLOADED_APP', 'true');
      setHasDownloaded(true);
      
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn("Download/Persistence error:", e);
      Alert.alert("Shield Update", "Could not connect to the Update Server. Please verify you are on the same WiFi as the Shield backend.");
    }
  }, []);

  const handleShare = useCallback(async () => {
    const url = APP_LINKS.getShareUrl();
    try {
      await Share.share({
        message: `${APP_LINKS.SHARE_MESSAGE} ${url}`,
        url: url,
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert("Share Error", error.message);
    }
  }, []);

  React.useEffect(() => {
    fetchDownloadStatus();
  }, [fetchDownloadStatus]);

  React.useEffect(() => {
    if (tab) {
      const tabIndex = parseInt(tab);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex < 5) {
        handleTabPress(tabIndex);
      } else {
        // Handle named tabs
        const tabMap: Record<string, number> = {
          shield: 0,
          scanner: 1,
          alerts: 2,
          game: 3,
          profile: 4
        };
        if (tabMap[tab]) {
          handleTabPress(tabMap[tab]);
        }
      }
    }
  }, [tab]);

  const TAB_BAR_HEIGHT = 64;
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 20; // Extra padding for floating look

  // Tab specific colors from theme
  const getTabColor = (index: number) => {
    switch (index) {
      case 0: return theme.cyan;
      case 1: return theme.blue;
      case 2: return theme.red; // Alerts Dashboard
      case 3: return theme.purple;
      case 4: return theme.yellow;
      default: return theme.cyan;
    }
  };

  const handleTabPress = useCallback((index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setActiveTab(index);
    Animated.spring(indicatorAnim, {
      toValue: index * (width / 5),
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  }, [indicatorAnim, width]);

  const handleScroll = useCallback((e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newPage = Math.round(offsetX / width);
    if (newPage !== activeTab && newPage >= 0 && newPage < 5) {
      setActiveTab(newPage);
      Animated.spring(indicatorAnim, {
        toValue: newPage * (width / 5),
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
    }
  }, [activeTab, indicatorAnim]);

  const activeColor = getTabColor(activeTab);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <AnimatedBackground color={activeColor} isDarkMode={profile.isDarkMode} />
      
      <View style={[styles.header, { borderBottomColor: theme.border + "40", backgroundColor: "transparent" }]}>
        <View style={styles.headerLeft}>
          <Logo size={28} showText={false} isDarkMode={profile.isDarkMode} />
          <Text style={[styles.headerTitle, { color: theme.text, marginLeft: 8 }]}>
            {t(SCREEN_TITLE_KEYS[activeTab])}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={toggleTheme} 
            style={[styles.themeBtn, { backgroundColor: theme.surface + "80", borderColor: theme.border + "40" }]}
          >
            <MaterialCommunityIcons 
              name={profile.isDarkMode ? "weather-sunny" : "weather-night"} 
              size={18} 
              color={theme.yellow} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleShare} 
            style={[styles.themeBtn, { backgroundColor: theme.surface + "80", borderColor: theme.border + "40" }]}
          >
            <MaterialCommunityIcons name="share-variant" size={18} color={theme.purple} />
          </TouchableOpacity>

          {!hasDownloaded && (
            <TouchableOpacity 
              onPress={handleDownload}
              style={[styles.themeBtn, { backgroundColor: theme.surface + "80", borderColor: theme.border + "40" }]}
            >
              <MaterialCommunityIcons name="cloud-download-outline" size={18} color={activeColor} />
            </TouchableOpacity>
          )}

          <View style={[styles.liveBadge, { backgroundColor: activeColor + "15", borderColor: activeColor + "40" }]}>
            <View style={[styles.liveDot, { backgroundColor: activeColor }]} />
            <Text style={[styles.liveText, { color: activeColor }]}>LIVE</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        style={styles.pager}
        bounces={false}
        decelerationRate="fast"
      >
        <View style={[styles.page, { width, backgroundColor: "transparent" }]}>
          <ProtectionDashboard />
        </View>
        <View style={[styles.page, { width, backgroundColor: "transparent" }]}>
          <EmailScanner />
        </View>
        <View style={[styles.page, { width, backgroundColor: "transparent" }]}>
          <ScamAlertsDashboard />
        </View>
        <View style={[styles.page, { width, backgroundColor: "transparent" }]}>
          <CyberRunnerGame />
        </View>
        <View style={[styles.page, { width, backgroundColor: "transparent" }]}>
          <ProfileDashboard />
        </View>
      </ScrollView>

      <View style={[styles.tabBarContainer, { bottom: bottomPadding - 10 }]}>
        <BlurView 
          intensity={80} 
          tint={profile.isDarkMode ? "dark" : "light"} 
          style={[styles.tabBar, {
            borderColor: activeColor + "30",
            backgroundColor: profile.isDarkMode ? "rgba(30, 41, 59, 0.5)" : "rgba(255, 255, 255, 0.5)",
          }]}
        >
          <Animated.View style={[styles.tabIndicator, {
            transform: [{ translateX: indicatorAnim }],
            backgroundColor: activeColor + "15",
            borderTopColor: activeColor,
            width: width / 5,
          }]} />

          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const tabColor = getTabColor(tab.id);
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                onPress={() => handleTabPress(tab.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={(isActive ? tab.activeIcon : tab.icon) as any}
                  size={22}
                  color={isActive ? tabColor : theme.textDim}
                />
                <Text style={[styles.tabLabel, { color: isActive ? tabColor : theme.textDim }]} numberOfLines={1}>
                  {t(tab.key)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  themeBtn: {
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
  },
  pager: { flex: 1 },
  page: { flex: 1 },
  tabBarContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 64,
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: "row",
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 10,
  },
  tabIndicator: {
    position: "absolute",
    top: 10,
    bottom: 10,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    letterSpacing: 0.2,
  },
});
