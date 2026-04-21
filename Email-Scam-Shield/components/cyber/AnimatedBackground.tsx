import React, { useEffect } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate,
  withDelay
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

interface AnimatedBackgroundProps {
  color?: string;
  isDarkMode?: boolean;
}

export default function AnimatedBackground({ color = "#22D3EE", isDarkMode = true }: AnimatedBackgroundProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 8000 }),
      -1,
      true
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-width * 0.2, width * 0.4]) },
      { translateY: interpolate(progress.value, [0, 1], [-height * 0.1, height * 0.2]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.5]) },
    ],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [width * 0.8, width * 0.3]) },
      { translateY: interpolate(progress.value, [0, 1], [height * 0.1, height * 0.6]) },
      { scale: interpolate(progress.value, [0, 1], [1.2, 0.8]) },
    ],
  }));

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC" }]}>
      <Animated.View style={[styles.orb, orb1Style, { backgroundColor: color + "15" }]} />
      <Animated.View style={[styles.orb, orb2Style, { backgroundColor: color + "10" }]} />
      
      <LinearGradient
        colors={isDarkMode 
          ? ["transparent", "rgba(15, 23, 42, 0.8)", "#0F172A"] 
          : ["transparent", "rgba(248, 250, 252, 0.8)", "#F8FAFC"]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: -1,
  },
  orb: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
});
