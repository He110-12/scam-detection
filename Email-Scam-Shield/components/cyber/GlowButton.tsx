import React, { useRef } from "react";
import {
  Pressable, Text, StyleSheet, Animated, ViewStyle, TextStyle
} from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const { CYBER } = Colors;

interface GlowButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: "solid" | "outline";
}

export default function GlowButton({
  label, onPress, color = CYBER.cyan, textColor = CYBER.background,
  size = "md", style, textStyle, disabled = false, variant = "solid"
}: GlowButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 30 }),
      Animated.timing(glowAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }),
      Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.8] });
  const shadowRadius = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [6, 20] });

  const padding = size === "sm" ? { paddingVertical: 8, paddingHorizontal: 16 }
    : size === "lg" ? { paddingVertical: 18, paddingHorizontal: 32 }
    : { paddingVertical: 14, paddingHorizontal: 24 };

  const fontSize = size === "sm" ? 13 : size === "lg" ? 17 : 15;

  return (
    <Animated.View style={[
      styles.container,
      { transform: [{ scale: scaleAnim }] },
      style,
    ]}>
      <Animated.View style={[
        styles.glow,
        { backgroundColor: color, opacity: glowOpacity, shadowColor: color, shadowRadius },
      ]} />
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          padding,
          variant === "solid" ? { backgroundColor: color } : {
            backgroundColor: "transparent",
            borderWidth: 1.5,
            borderColor: color,
          },
          disabled && styles.disabled,
        ]}
      >
        <Text style={[
          styles.label,
          { fontSize, color: variant === "solid" ? textColor : color },
          textStyle,
        ]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    elevation: 8,
  },
  button: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.4,
  },
});
