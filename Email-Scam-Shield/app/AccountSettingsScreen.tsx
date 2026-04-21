import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useProfile } from "@/context/ProfileContext";
import Colors from "@/constants/colors";
import CyberCard from "@/components/cyber/CyberCard";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function AccountSettingsScreen() {
  const { title } = useLocalSearchParams();
  const router = useRouter();
  const { profile, setBackendConfig } = useProfile();
  const theme = profile.isDarkMode ? Colors.dark : Colors.light;
  const [backendMode, setBackendMode] = useState<"local" | "remote" | "auto">(profile.backendMode);
  const [backendUrl, setBackendUrl] = useState<string>(profile.backendUrl);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <MaterialCommunityIcons name="cogs" size={60} color={theme.cyan} style={styles.icon} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Configuration Locked</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          These {title} settings are currently locked under your basic security clearance profile. 
          Future updates will unlock these administrative modules.
        </Text>

        <CyberCard glowColor={theme.border} style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.cyan} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Your security preferences and data sync are currently operating at OPTIMAL default parameters. System hygiene is maintained automatically.
          </Text>
        </CyberCard>
        <CyberCard glowColor={theme.border} style={[styles.infoCard, { backgroundColor: theme.surface, width: '100%', marginTop: 16 }]}> 
          <View style={{ width: '100%' }}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Backend Server Mode</Text>
            <View style={styles.modeRow}>
              {(["local", "remote", "auto"] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setBackendMode(option)}
                  style={[styles.modeButton, backendMode === option && { borderColor: theme.cyan, backgroundColor: theme.cyan + "20" }]}
                >
                  <Text style={{ color: backendMode === option ? theme.cyan : theme.text }}>{option.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.settingLabel, { color: theme.text, marginTop: 12 }]}>Backend URL</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceElevated, color: theme.text }]}
              value={backendUrl}
              onChangeText={setBackendUrl}
              placeholder="http://192.168.137.1:5000"
              placeholderTextColor={theme.textSecondary}
            />
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.cyan }]}
              onPress={() => setBackendConfig(backendMode, backendUrl)}
            >
              <Text style={[styles.saveButtonText, { color: theme.background }]}>Save Server Config</Text>
            </TouchableOpacity>
          </View>
        </CyberCard>      </View>
    </ScrollView>
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
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  content: {
    padding: 30,
    alignItems: "center",
    marginTop: 40,
  },
  icon: {
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  infoCard: {
    flexDirection: "row",
    padding: 20,
    gap: 15,
    alignItems: "flex-start",
  },
  infoText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  settingLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  input: {
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    padding: 10,
    marginBottom: 12,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 5,
    alignItems: "center",
  },
  saveButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  }
});
