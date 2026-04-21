import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

const { CYBER } = Colors;

export default function SplashScreen() {
  const shieldScale = useRef(new Animated.Value(0.3)).current;
  const shieldOpacity = useRef(new Animated.Value(0)).current;
  const ringScale1 = useRef(new Animated.Value(0.5)).current;
  const ringScale2 = useRef(new Animated.Value(0.5)).current;
  const scanLineY = useRef(new Animated.Value(-80)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(loadingAnim, {
      toValue: 1,
      duration: 2800,
      useNativeDriver: false,
    }).start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(shieldScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 40 }),
        Animated.timing(shieldOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(ringScale1, { toValue: 1.2, useNativeDriver: true, friction: 4 }),
        Animated.spring(ringScale2, { toValue: 1.4, useNativeDriver: true, friction: 3 }),
        Animated.timing(scanLineY, {
          toValue: 80,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(textY, { toValue: 0, useNativeDriver: true, friction: 6 }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        { iterations: 2 }
      ),
    ]).start(() => {
      setTimeout(() => router.replace("/main"), 400);
    });
  }, [
    glowAnim,
    loadingAnim,
    pulseAnim,
    ringScale1,
    ringScale2,
    scanLineY,
    shieldOpacity,
    shieldScale,
    textOpacity,
    textY,
  ]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGrid}>
        {[...Array(12)].map((_, i) => (
          <View key={i} style={[styles.gridLine, { left: `${i * 9}%` as any }]} />
        ))}
        {[...Array(12)].map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLineH, { top: `${i * 9}%` as any }]} />
        ))}
      </View>

      <View style={styles.centerSection}>
        <Animated.View style={[styles.outerRing, {
          transform: [{ scale: ringScale2 }],
          borderColor: CYBER.cyan + "20",
        }]} />
        <Animated.View style={[styles.middleRing, {
          transform: [{ scale: ringScale1 }],
          borderColor: CYBER.blue + "30",
        }]} />

        <Animated.View style={[styles.glowEffect, {
          opacity: glowOpacity,
          transform: [{ scale: shieldScale }],
        }]} />

        <Animated.View style={[styles.shieldContainer, {
          opacity: shieldOpacity,
          transform: [{ scale: Animated.multiply(shieldScale, pulseAnim) }],
        }]}>
          <View style={styles.shieldInner}>
            <View style={styles.scanLineContainer}>
              <Animated.View style={[styles.scanLine, {
                transform: [{ translateY: scanLineY }],
              }]} />
            </View>
            <MaterialCommunityIcons name="shield" size={100} color={CYBER.cyan} />
            <View style={styles.lockOverlay}>
              <MaterialCommunityIcons name="lock" size={36} color={CYBER.background} />
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.textSection, {
        opacity: textOpacity,
        transform: [{ translateY: textY }],
      }]}>
        <Text style={styles.appName}>Email Scam Shield</Text>
        <View style={styles.taglineRow}>
          <View style={styles.taglineDot} />
          <Text style={styles.tagline}>AI Powered Protection</Text>
          <View style={styles.taglineDot} />
        </View>

        <View style={styles.loadingRow}>
          <View style={styles.loadingBar}>
            <Animated.View style={[styles.loadingFill, {
              width: loadingAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            }]} />
          </View>
          <Text style={styles.loadingText}>Initializing</Text>
        </View>
      </Animated.View>

      <View style={styles.cornerTL} />
      <View style={styles.cornerTR} />
      <View style={styles.cornerBL} />
      <View style={styles.cornerBR} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CYBER.background,
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundGrid: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.15,
  },
  gridLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: CYBER.cyan,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: CYBER.cyan,
  },
  centerSection: {
    alignItems: "center",
    justifyContent: "center",
    width: 260,
    height: 260,
    marginBottom: 40,
  },
  outerRing: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
  },
  middleRing: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  glowEffect: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: CYBER.cyan,
    shadowColor: CYBER.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
  },
  shieldContainer: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
  },
  shieldInner: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  scanLineContainer: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 130,
    overflow: "hidden",
    zIndex: 10,
  },
  scanLine: {
    height: 3,
    backgroundColor: CYBER.cyan,
    shadowColor: CYBER.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    opacity: 0.9,
  },
  lockOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  textSection: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    color: CYBER.text,
    letterSpacing: 1,
    textAlign: "center",
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  taglineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: CYBER.cyan,
  },
  tagline: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: CYBER.cyan,
    letterSpacing: 2,
  },
  loadingRow: {
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    width: "100%",
  },
  loadingBar: {
    width: 200,
    height: 3,
    backgroundColor: CYBER.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  loadingFill: {
    height: "100%",
    backgroundColor: CYBER.cyan,
    borderRadius: 2,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: CYBER.textDim,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  cornerTL: {
    position: "absolute", top: 20, left: 20,
    width: 20, height: 20,
    borderTopWidth: 2, borderLeftWidth: 2,
    borderColor: CYBER.cyan + "60",
  },
  cornerTR: {
    position: "absolute", top: 20, right: 20,
    width: 20, height: 20,
    borderTopWidth: 2, borderRightWidth: 2,
    borderColor: CYBER.cyan + "60",
  },
  cornerBL: {
    position: "absolute", bottom: 20, left: 20,
    width: 20, height: 20,
    borderBottomWidth: 2, borderLeftWidth: 2,
    borderColor: CYBER.cyan + "60",
  },
  cornerBR: {
    position: "absolute", bottom: 20, right: 20,
    width: 20, height: 20,
    borderBottomWidth: 2, borderRightWidth: 2,
    borderColor: CYBER.cyan + "60",
  },
});
