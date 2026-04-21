import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const { CYBER } = Colors;

interface CyberCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  padding?: number;
  glass?: boolean;
  intensity?: number;
}

export default function CyberCard({ 
  children, 
  style, 
  glowColor = CYBER.cyan, 
  padding = 16,
  glass = false,
  intensity = 30
}: CyberCardProps) {
  const CardContainer = glass && Platform.OS !== "web" ? BlurView : View;

  return (
    <View style={[
      styles.card,
      {
        borderColor: glowColor + "30",
        shadowColor: glowColor,
        backgroundColor: glass ? "transparent" : CYBER.surface,
      },
      style,
    ]}>
      {glass && (
        <BlurView 
          intensity={intensity} 
          tint="dark" 
          style={StyleSheet.absoluteFill} 
        />
      )}
      <LinearGradient
        colors={[glowColor + "15", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.topLine, { backgroundColor: glowColor }]} />
      <View style={{ padding }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    overflow: "hidden",
  },
  topLine: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    opacity: 0.8,
  },
});
