import React, { useState, useEffect, useRef } from "react";
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Dimensions, ScrollView, StatusBar, Vibration, Image,
  Animated as RNAnimated
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  interpolateColor
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GAME_LEVELS, AVATARS, getRank, GateMessage } from "@/data/gameData";
import { useProfile } from "@/context/ProfileContext";
import Colors from "@/constants/colors";
import CyberCard from "@/components/cyber/CyberCard";
import GlowButton from "@/components/cyber/GlowButton";

const { width, height } = Dimensions.get("window");

export default function CyberRunnerGame() {
  const { profile, updateGameScore, setAvatar, setCustomAvatar, t } = useProfile();
  const [gameState, setGameState] = useState<"AVATAR_SELECT" | "PLAYING" | "COMPLETED">("AVATAR_SELECT");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [explanation, setExplanation] = useState<GateMessage | null>(null);
  const [showCombo, setShowCombo] = useState(false);
  const comboPopAnim = useRef(new RNAnimated.Value(0)).current;
  
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  
  const [highScore, setHighScore] = useState(0);
  const [hasTimeFreeze, setHasTimeFreeze] = useState(true);
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);

  // Reanimated Transitions
  const tunnelPos = useSharedValue(0);
  const hudGlow = useSharedValue(0);
  const breachGlitch = useSharedValue(0);

  const theme = profile.isDarkMode ? Colors.dark : Colors.light;

  // Load High Score on mount
  useEffect(() => {
    const loadHighScore = async () => {
      try {
        const saved = await AsyncStorage.getItem("cyberRunnerHighScore");
        if (saved) setHighScore(parseInt(saved, 10));
      } catch (e) {}
    };
    loadHighScore();
  }, []);

  const saveHighScore = async (finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      try {
        await AsyncStorage.setItem("cyberRunnerHighScore", finalScore.toString());
      } catch (e) {}
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setCustomAvatar(result.assets[0].uri);
    }
  };

  // Animations & Effects
  useEffect(() => {
    if (gameState === "PLAYING") {
      tunnelPos.value = withRepeat(withTiming(1, { duration: 1000 }), -1, false);
      hudGlow.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
    } else {
      tunnelPos.value = 0;
      hudGlow.value = 0;
    }
  }, [gameState]);

  const tunnelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tunnelPos.value * 100 }],
    opacity: interpolate(tunnelPos.value, [0, 0.5, 1], [0.1, 0.3, 0.1])
  }));

  const hudStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(hudGlow.value, [0, 1], [theme.cyan + '40', theme.cyan + '80']),
  }));

  const glitchStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSequence(withTiming(breachGlitch.value * 5), withTiming(0)) },
      { skewX: `${breachGlitch.value * 2}deg` }
    ],
    backgroundColor: interpolateColor(breachGlitch.value, [0, 1], ['transparent', theme.red + '20'])
  }));

  const gateSlideAnim = useRef(new RNAnimated.Value(height)).current;
  const currentLevelData = GAME_LEVELS[currentLevel];
  const currentPair = currentLevelData.pairs[currentPairIndex];
  const selectedAvatar = AVATARS.find(a => a.id === profile.selectedAvatar) || AVATARS[0];

  useEffect(() => {
    if (gameState === "PLAYING") {
      startRound();
    }
  }, [gameState, currentPairIndex]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (gameState === "PLAYING" && !explanation && timeLeft > 0 && !isTimeFrozen) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !explanation && gameState === "PLAYING" && !isTimeFrozen) {
      handleTimeout();
    }
    return () => clearTimeout(timer);
  }, [gameState, explanation, timeLeft, isTimeFrozen]);

  const startRound = () => {
    setTimeLeft(10);
    gateSlideAnim.setValue(height);
    RNAnimated.spring(gateSlideAnim, {
      toValue: 150,
      useNativeDriver: true,
      tension: 20,
      friction: 7
    }).start();
  };

  const handleChoice = (choice: GateMessage) => {
    const isCorrect = !choice.isScam;
    
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const points = Math.round(10 * (newStreak >= 5 ? 2.0 : newStreak >= 3 ? 1.5 : 1.0));
      setScore(prev => Math.max(0, prev + points));
      
      if (newStreak >= 2) {
        setShowCombo(true);
        comboPopAnim.setValue(0);
        RNAnimated.sequence([
          RNAnimated.spring(comboPopAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 5 }),
          RNAnimated.delay(800),
          RNAnimated.timing(comboPopAnim, { toValue: 0, duration: 200, useNativeDriver: true })
        ]).start(() => setShowCombo(false));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setStreak(0);
      setLives(prev => prev - 1);
      breachGlitch.value = withSequence(withTiming(1, { duration: 50 }), withTiming(0, { duration: 200 }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScore(prev => Math.max(0, prev - 5));
    }
    setExplanation(choice);
  };

  const handleTimeout = () => {
    setStreak(0);
    setLives(prev => prev - 1);
    breachGlitch.value = withSequence(withTiming(1, { duration: 50 }), withTiming(0, { duration: 200 }));
    Vibration.vibrate([0, 150, 150, 300]);
    setExplanation({
      text: "SYSTEM TIMEOUT",
      isScam: true,
      explanation: "You ran out of time! Critical system breach detected.",
    });
  };

  const nextGate = () => {
    if (lives <= 0) {
      setGameState("COMPLETED");
      updateGameScore(score, true);
      saveHighScore(score);
      return;
    }
    setExplanation(null);
    if (currentPairIndex < currentLevelData.pairs.length - 1) {
      setCurrentPairIndex(prev => prev + 1);
    } else {
      setGameState("COMPLETED");
      updateGameScore(score, true);
      saveHighScore(score);
    }
  };

  const startGame = () => {
    setScore(0);
    setCurrentPairIndex(0);
    setLives(3);
    setStreak(0);
    setTimeLeft(10);
    setHasTimeFreeze(true);
    setIsTimeFrozen(false);
    setExplanation(null);
    setGameState("PLAYING");
  };

  const restartLevel = () => startGame();
  const nextLevel = () => {
    if (currentLevel < GAME_LEVELS.length - 1) {
      setCurrentLevel(prev => prev + 1);
      startGame();
    } else {
      setGameState("AVATAR_SELECT");
    }
  };

  if (gameState === "AVATAR_SELECT") {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.avatarContent}>
        <StatusBar barStyle={profile.isDarkMode ? "light-content" : "dark-content"} />
        <Text style={[styles.title, { color: theme.text }]}>{t("runnerTitle")}</Text>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: theme.yellow, marginTop: 5, textAlign: 'center', letterSpacing: 2 }}>
          PERSONAL BEST: {highScore}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary, marginTop: 15 }]}>{t("selectAvatar")}</Text>
        
        <TouchableOpacity onPress={pickImage} style={[styles.uploadBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
           <MaterialCommunityIcons name="camera-plus" size={24} color={theme.textSecondary} style={{ marginRight: 10 }} />
           <Text style={[styles.uploadBtnText, { color: theme.textSecondary }]}>{t("pickImage") || "Scan from Gallery"}</Text>
        </TouchableOpacity>

        <View style={styles.avatarGrid}>
          {AVATARS.map((avatar) => (
            <TouchableOpacity 
              key={avatar.id} 
              onPress={() => { setAvatar(avatar.id); setCustomAvatar(undefined); }}
              style={styles.avatarItem}
            >
              <CyberCard 
                glowColor={profile.selectedAvatar === avatar.id && !profile.customAvatar ? avatar.color : theme.border}
                style={[styles.avatarCard, { backgroundColor: theme.surface }, profile.selectedAvatar === avatar.id && !profile.customAvatar && { backgroundColor: avatar.color + "10" }]}
              >
                <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                <Text style={[styles.avatarName, { color: theme.text }]}>{avatar.name}</Text>
              </CyberCard>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.startSection}>
          <Text style={[styles.levelInfo, { color: theme.textDim }]}>TARGET LEVEL: {currentLevel + 1}</Text>
          <GlowButton 
            label={t("initiateRun")} 
            onPress={startGame} 
            color={selectedAvatar.color} 
          />
        </View>
      </ScrollView>
    );
  }

  if (gameState === "PLAYING") {
    return (
      <Animated.View style={[styles.gameContainer, glitchStyle, { backgroundColor: theme.background }]}>
        <View style={StyleSheet.absoluteFillObject}>
           <Animated.View style={[styles.parallaxGrid, tunnelStyle, { borderColor: theme.cyan + '10' }]} />
        </View>

        {/* Cockpit HUD */}
        <Animated.View style={[styles.hud, hudStyle, { backgroundColor: theme.surface + 'EE' }]}>
          <LinearGradient colors={['transparent', theme.cyan + '05']} style={StyleSheet.absoluteFill} />
          <View style={styles.hudItem}>
            <Text style={[styles.hudLabel, { color: theme.cyan }]}>XP_ENGINE</Text>
            <View style={styles.hudValueWrapper}>
              <Text style={[styles.hudValue, { color: theme.text }]}>{score}</Text>
              <MaterialCommunityIcons name="lightning-bolt" size={12} color={theme.yellow} />
            </View>
          </View>
          <View style={styles.hudItem}>
            <Text style={[styles.hudLabel, { color: theme.red }]}>SYSTEM_STABILITY</Text>
            <View style={styles.integrityBar}>
              {Array.from({length: 3}).map((_, i) => (
                <View key={i} style={[styles.integrityNode, { backgroundColor: i < lives ? theme.cyan : theme.red + '40', borderColor: i < lives ? theme.cyan : theme.red }]} />
              ))}
            </View>
          </View>
          <View style={styles.hudItem}>
            <Text style={[styles.hudLabel, { color: theme.purple }]}>NAV_SECTOR</Text>
            <Text style={[styles.hudValue, { color: theme.purple }]}>{currentLevel + 1}:{currentPairIndex + 1}</Text>
          </View>
        </Animated.View>

        <View style={styles.track}>
          <View style={[styles.timeBarContainer, { backgroundColor: theme.surface }]}>
            <Animated.View style={[styles.timeBar, { 
              width: `${(timeLeft / 10) * 100}%`, 
              backgroundColor: isTimeFrozen ? theme.cyan : timeLeft <= 3 ? theme.red : theme.green,
            }]} />
          </View>
          
          {showCombo && (
            <RNAnimated.View style={[styles.comboBadge, { backgroundColor: theme.yellow, transform: [{ scale: comboPopAnim }] }]}>
              <Text style={styles.comboText}>{streak}X COMBO!</Text>
            </RNAnimated.View>
          )}

          {!explanation ? (
            <RNAnimated.View style={[styles.gates, { transform: [{ translateY: gateSlideAnim }] }]}>
              {currentPair.map((gate, i) => (
                <TouchableOpacity key={i} style={styles.gate} onPress={() => handleChoice(gate)}>
                  <CyberCard glowColor={theme.cyan + '40'} style={[styles.gateCard, { backgroundColor: 'rgba(15,23,42,0.8)' }]}>
                    <Text style={[styles.gateText, { color: theme.text }]}>{gate.text}</Text>
                  </CyberCard>
                </TouchableOpacity>
              ))}
            </RNAnimated.View>
          ) : (
            <View style={styles.explanationContainer}>
              <CyberCard glowColor={explanation.isScam ? theme.red : theme.green} style={[styles.explanationCard, { backgroundColor: 'rgba(15,23,42,0.95)' }]}>
                <View style={[styles.explIconCircle, { borderColor: explanation.isScam ? theme.red : theme.green }]}>
                  <MaterialCommunityIcons name={explanation.isScam ? "shield-alert" : "shield-check"} size={32} color={explanation.isScam ? theme.red : theme.green} />
                </View>
                <Text style={[styles.explanationTitle, { color: explanation.isScam ? theme.red : theme.green }]}>{explanation.isScam ? "THREAT DETECTED" : "DATA VERIFIED"}</Text>
                <Text style={[styles.explanationText, { color: theme.textSecondary }]}>{explanation.explanation}</Text>
                <GlowButton label="CONTINUE_RUN" onPress={nextGate} color={theme.cyan} style={{ width: "100%", marginTop: 25 }} />
              </CyberCard>
            </View>
          )}
        </View>
      </Animated.View>
    );
  }

  const { rank, color } = getRank(score);
  return (
    <View style={[styles.gameContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { marginTop: 60, color: lives <= 0 ? theme.red : theme.text }]}>{lives <= 0 ? "SYSTEM BREACHED" : "LEVEL CLEARED"}</Text>
      <CyberCard style={[styles.resultCard, { backgroundColor: theme.surface }]} glowColor={lives <= 0 ? theme.red : color}>
        <Text style={[styles.resultLabel, { color: theme.textDim }]}>{t("finalScore")}</Text>
        <Text style={[styles.resultValue, { color: lives <= 0 ? theme.red : color }]}>{score}</Text>
        <View style={[styles.rankBadge, { backgroundColor: theme.surfaceElevated }]}>
          <Text style={[styles.rankLabel, { color: theme.textSecondary }]}>{t("rankAchieved")}</Text>
          <Text style={[styles.rankValue, { color }]}>{rank.toUpperCase()}</Text>
        </View>
        <View style={styles.resultActions}>
          <GlowButton label={t("replayLevel")} onPress={restartLevel} color={theme.surfaceElevated} style={styles.actionBtn} />
          {lives > 0 && <GlowButton label={t("nextLevel")} onPress={nextLevel} color={theme.cyan} style={styles.actionBtn} /> }
        </View>
      </CyberCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  avatarContent: { padding: 20, alignItems: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, textAlign: "center", marginTop: 10 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 30 },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 15 },
  avatarItem: { width: (width - 60) / 2 },
  avatarCard: { alignItems: "center", padding: 20, gap: 10 },
  avatarEmoji: { fontSize: 40 },
  avatarName: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  startSection: { marginTop: 40, width: "100%", alignItems: "center", gap: 15 },
  levelInfo: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 2 },
  gameContainer: { flex: 1 },
  hud: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginTop: 40,
    marginHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#00FFFF',
    shadowRadius: 10,
    overflow: 'hidden',
  },
  hudItem: { alignItems: "center" },
  hudLabel: { fontFamily: "Inter_900Black", fontSize: 7, letterSpacing: 1.5, marginBottom: 4 },
  hudValueWrapper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hudValue: { fontFamily: "Inter_800ExtraBold", fontSize: 16 },
  integrityBar: { flexDirection: 'row', gap: 6, marginTop: 4 },
  integrityNode: { width: 12, height: 4, borderRadius: 2, borderWidth: 1 },
  track: { flex: 1, alignItems: "center", justifyContent: "center" },
  timeBarContainer: { width: "100%", height: 6, position: "absolute", top: 0, zIndex: 10 },
  timeBar: { height: "100%" },
  gates: { width: width, paddingHorizontal: 20, gap: 20 },
  gate: { width: "100%" },
  gateCard: { padding: 18, minHeight: 80, justifyContent: "center" },
  gateText: { fontFamily: "Inter_500Medium", fontSize: 14, textAlign: "center", lineHeight: 20 },
  explanationContainer: { padding: 20, width: "100%", zIndex: 10 },
  explanationCard: { padding: 24, alignItems: "center" },
  explIconCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  explanationTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginTop: 12, marginBottom: 8 },
  explanationText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  resultCard: { margin: 20, padding: 30, alignItems: "center" },
  resultLabel: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 2 },
  resultValue: { fontFamily: "Inter_700Bold", fontSize: 60, marginVertical: 10 },
  rankBadge: { alignItems: "center", marginVertical: 20, padding: 15, borderRadius: 8, width: "100%" },
  rankLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  rankValue: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 4 },
  resultActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  actionBtn: { flex: 1 },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 20, width: "100%" },
  uploadBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  parallaxGrid: { ...StyleSheet.absoluteFillObject, borderWidth: 1, height: height * 1.5 },
  comboBadge: { position: 'absolute', top: 60, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, zIndex: 100 },
  comboText: { fontFamily: 'Inter_900Black', fontSize: 14, color: '#000', letterSpacing: 1 },
});
