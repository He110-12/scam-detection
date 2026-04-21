import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

interface LogoProps {
  size?: number;
  showText?: boolean;
  isDarkMode?: boolean;
}

export default function Logo({ size = 40, showText = true, isDarkMode = true }: LogoProps) {
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const logoColor = theme.cyan;

  return (
    <View style={styles.container}>
      <View style={[styles.logoWrapper, { width: size, height: size }]}>
        <LinearGradient
          colors={[logoColor + '40', 'transparent']}
          style={[styles.glow, { borderRadius: size / 2 }]}
        />
        <MaterialCommunityIcons name="shield-lock" size={size * 0.8} color={logoColor} />
      </View>
      {showText && (
        <View style={styles.textWrapper}>
          <Text style={[styles.brandText, { color: theme.text, fontSize: size * 0.45 }]}>
            CYBER<Text style={{ color: logoColor }}>SHIELD</Text>
          </Text>
          <Text style={[styles.tagline, { color: theme.textDim, fontSize: size * 0.2 }]}>
            NEURAL_CORE_v2.0
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  textWrapper: {
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: 'Inter_900Black',
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    marginTop: -2,
  }
});
