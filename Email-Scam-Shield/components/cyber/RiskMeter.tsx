import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Colors from "@/constants/colors";

const { CYBER } = Colors;

export type RiskLevel = "safe" | "suspicious" | "high";

interface RiskMeterProps {
  level: RiskLevel;
  score: number;
}

const RISK_CONFIG = {
  safe: { label: "SAFE", color: CYBER.green, bgColor: CYBER.greenDim + "30", description: "No threats detected" },
  suspicious: { label: "SUSPICIOUS", color: CYBER.yellow, bgColor: CYBER.yellowDim + "30", description: "Some indicators detected" },
  high: { label: "HIGH RISK", color: CYBER.red, bgColor: CYBER.redDim + "30", description: "Multiple scam patterns found" },
};

export default function RiskMeter({ level, score }: RiskMeterProps) {
  const config = RISK_CONFIG[level];
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: score,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    if (level !== "safe") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [level, score, widthAnim, pulseAnim]);

  const widthPercent = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View style={[
      styles.container,
      { backgroundColor: config.bgColor, borderColor: config.color + "40", transform: [{ scale: pulseAnim }] }
    ]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: config.color + "20", borderColor: config.color + "60" }]}>
          <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
        </View>
        <Text style={[styles.score, { color: config.color }]}>{score}%</Text>
      </View>
      <Text style={styles.description}>{config.description}</Text>
      <View style={styles.barBg}>
        <Animated.View style={[styles.barFill, { width: widthPercent, backgroundColor: config.color }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 1,
  },
  score: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  description: {
    color: CYBER.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  barBg: {
    height: 6,
    backgroundColor: CYBER.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
});
