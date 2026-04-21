import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, Linking, Platform, TouchableOpacity, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
  FadeInUp,
  FadeInDown,
  Layout
} from "react-native-reanimated";
import { useProfile } from "@/context/ProfileContext";
import Colors from "@/constants/colors";
import GlowButton from "@/components/cyber/GlowButton";
import CyberCard from "@/components/cyber/CyberCard";
import RiskMeter from "@/components/cyber/RiskMeter";
import Logo from "@/components/cyber/Logo";

export default function ProtectionDashboard() {
  const { profile, toggleProtection, t } = useProfile();
  const [showWarning, setShowWarning] = useState(false);
  const [events, setEvents] = useState([
    { id: '1', time: 'SYNCING', type: 'SECURE', msg: 'Connecting to Galactic Neural Node...' },
  ]);

  const theme = profile.isDarkMode ? Colors.dark : Colors.light;
  const pulse = useSharedValue(1);
  const radar = useSharedValue(0);
  const rotation = useSharedValue(0);

  const fetchLiveLogs = async () => {
    try {
      const res = await fetch(`${profile.backendUrl}/api/alerts?limit=5`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const formatted = data.map((item: any, idx: number) => ({
          id: item._id || String(idx),
          time: new Date(item.publishedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'BLOCK',
          msg: item.title.length > 40 ? item.title.substring(0, 37) + "..." : item.title
        }));
        setEvents(formatted);
      }
    } catch (error) {
      console.warn("Live log sync failed", error);
    }
  };

  useEffect(() => {
    fetchLiveLogs();
    
    if (profile.protectionEnabled) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        true
      );
      radar.value = withRepeat(
        withTiming(1, { duration: 3000 }),
        -1,
        false
      );
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000 }),
        -1,
        false
      );

      // Periodically fetch real logs from backend
      const interval = setInterval(fetchLiveLogs, 30000);
      return () => clearInterval(interval);
    } else {
      pulse.value = withTiming(1);
      radar.value = 0;
      rotation.value = 0;
    }
  }, [profile.protectionEnabled]);

  const shieldStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: profile.protectionEnabled ? 1 : 0.6,
  }));

  const radarStyle = useAnimatedStyle(() => ({
    opacity: profile.protectionEnabled ? interpolate(radar.value, [0, 0.4, 0.5, 0.6, 1], [0, 0, 1, 1, 0]) : 0,
    transform: [{ scale: radar.value * 2 }],
    borderWidth: 2,
    borderColor: theme.cyan + '40',
    borderRadius: 100,
    position: 'absolute',
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: profile.protectionEnabled ? 0.4 : 0,
  }));

  const handleToggle = () => {
    toggleProtection();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <StatusBar barStyle={profile.isDarkMode ? "light-content" : "dark-content"} />
      
      <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
        <View style={{ marginBottom: 20 }}>
          <Logo size={46} isDarkMode={profile.isDarkMode} />
        </View>
        <View style={styles.shieldContainer}>
          <Animated.View style={[styles.ringContainer, rotateStyle]}>
             <MaterialCommunityIcons name="circle-outline" size={140} color={theme.cyan} />
          </Animated.View>
          <Animated.View style={[styles.radarCircle, radarStyle]} />
          <Animated.View style={shieldStyle}>
            <MaterialCommunityIcons 
              name={profile.protectionEnabled ? "shield-check" : "shield-alert"} 
              size={90} 
              color={profile.protectionEnabled ? theme.cyan : theme.red} 
            />
          </Animated.View>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          {profile.protectionEnabled ? "ULTRA-SECURE MODE" : t("protectionTitle")}
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {profile.protectionEnabled ? "Your data is flowing through our encrypted neural nodes." : t("protectionDesc")}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)}>
        <CyberCard 
          glass 
          intensity={process.env.NODE_ENV === 'development' ? 20 : 40}
          glowColor={profile.protectionEnabled ? theme.cyan : theme.red} 
          style={styles.statusCard}
        >
          <View style={styles.statusRow}>
            <View>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>{t("autoProtectionStatus")}</Text>
              <Text style={[styles.statusValue, { color: profile.protectionEnabled ? theme.cyan : theme.red }]}>
                {profile.protectionEnabled ? t("activeSecure") : t("vulnerable")}
              </Text>
            </View>
            <Switch
              value={profile.protectionEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: theme.surfaceElevated, true: theme.cyan + "50" }}
              thumbColor={profile.protectionEnabled ? theme.cyan : theme.red}
            />
          </View>
        </CyberCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300)} style={styles.actionContainer}>
        <GlowButton
          label={profile.protectionEnabled ? t("activeSecure") : t("enablePhishing")}
          onPress={handleToggle}
          color={profile.protectionEnabled ? theme.blue : theme.cyan}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)}>
        <CyberCard glass style={styles.infoCard}>
          <View style={styles.sectionHeader}>
             <Text style={[styles.infoTitle, { color: theme.cyan }]}>🛰️ NETWORK_THREAT_LOG</Text>
             <View style={[styles.liveIndicator, { backgroundColor: profile.protectionEnabled ? theme.green + '20' : theme.border }]}>
               <Text style={[styles.liveText, { color: profile.protectionEnabled ? theme.green : theme.textDim }]}>
                 {profile.protectionEnabled ? 'MONITORING' : 'OFFLINE'}
               </Text>
             </View>
          </View>
          <View style={styles.logContainer}>
            {events.map((ev, i) => (
              <Animated.View key={ev.id} entering={FadeInUp.delay(i * 100)} style={styles.logRow}>
                <Text style={[styles.logTime, { color: theme.textDim }]}>{ev.time}</Text>
                <Text style={[styles.logMsg, { color: theme.textSecondary }]} numberOfLines={1}>
                  <Text style={{ color: theme.cyan }}>[SYS] </Text>{ev.msg}
                </Text>
              </Animated.View>
            ))}
          </View>
        </CyberCard>
      </Animated.View>

      {/* Demo Warning Trigger */}
      <TouchableOpacity 
        style={styles.demoLink} 
        onPress={() => setShowWarning(true)}
      >
        <Text style={[styles.demoText, { color: theme.textDim }]}>{t("viewDemo")}</Text>
      </TouchableOpacity>

      {showWarning && (
        <View style={[styles.overlay, { backgroundColor: profile.isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)" }]}>
          <CyberCard glowColor={theme.red} style={[styles.warningCard, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="alert-decagram" size={50} color={theme.red} style={styles.warningIcon} />
            <Text style={[styles.warningTitle, { color: theme.red }]}>{t("scamDetected")}</Text>
            <RiskMeter level="high" score={85} />
            
            <View style={styles.reasonList}>
              <Text style={[styles.reasonText, { color: theme.text }]}>• Suspicious link detected (.xyz domain)</Text>
              <Text style={[styles.reasonText, { color: theme.text }]}>• Urgent threat language found</Text>
              <Text style={[styles.reasonText, { color: theme.text }]}>• Unverified sender mask</Text>
            </View>

            <View style={styles.warningActions}>
              <GlowButton 
                label={t("safeExit")} 
                onPress={() => setShowWarning(false)} 
                color={theme.green} 
                style={styles.actionBtn}
              />
              <GlowButton 
                label={t("reportScam")} 
                onPress={() => setShowWarning(false)} 
                color={theme.red}
                style={styles.actionBtn}
              />
            </View>
          </CyberCard>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    marginTop: 15,
    letterSpacing: 1,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
  statusCard: {
    padding: 16,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginTop: 4,
  },
  actionContainer: {
    marginVertical: 10,
  },
  infoCard: {
    padding: 16,
  },
  infoTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 8,
  },
  infoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  demoLink: {
    alignSelf: "center",
    marginTop: 10,
  },
  demoText: {
    fontFamily: "Inter_500Medium",
    textDecorationLine: "underline",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    padding: 20,
    zIndex: 100,
  },
  warningCard: {
    padding: 20,
    alignItems: "center",
  },
  warningIcon: {
    marginBottom: 10,
  },
  warningTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    marginBottom: 20,
  },
  reasonList: {
    width: "100%",
    marginVertical: 20,
    gap: 8,
  },
  reasonText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  warningActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
  },
  shieldContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringContainer: {
    position: 'absolute',
    opacity: 0.4,
  },
  radarCircle: {
    width: 100,
    height: 100,
    borderWidth: 2,
    position: 'absolute',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  liveIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  liveText: {
    fontSize: 8,
    fontFamily: 'Inter_900Black',
    letterSpacing: 1,
  },
  logContainer: {
    gap: 12,
  },
  logRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  logTime: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    width: 60,
  },
  logMsg: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
});
