import React, { useState } from "react";
import { 
  View, Text, StyleSheet, ScrollView, 
  FlatList, Dimensions, TouchableOpacity, Modal, Alert, Image, Share
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  FadeInDown,
  FadeInUp
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useProfile, Badge, ProfileType } from "@/context/ProfileContext";
import { translations } from "@/constants/translations";

import { AVATARS } from "@/data/gameData";
import Colors from "@/constants/colors";
import CyberCard from "@/components/cyber/CyberCard";
import { APP_LINKS } from "@/constants/links";

const { width } = Dimensions.get("window");

export default function ProfileDashboard() {
  const router = useRouter();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrType, setQrType] = useState<"download" | "sync">("download");

  const { profile, setLanguage, toggleTheme, setProfileType, setAvatar, setCustomAvatar, t } = useProfile();
  const selectedAvatar = AVATARS.find(a => a.id === profile.selectedAvatar) || AVATARS[0];

  const theme = profile.isDarkMode ? Colors.dark : Colors.light;

  const scanBar = useSharedValue(0);

  React.useEffect(() => {
    scanBar.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      false
    );
  }, []);

  const scanBarStyle = useAnimatedStyle(() => ({
    top: `${scanBar.value * 100}%`,
    opacity: scanBar.value > 0.95 ? 0 : 0.6,
  }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setCustomAvatar(result.assets[0].uri);
      setShowAvatarModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleShareApp = async () => {
    const url = APP_LINKS.getShareUrl();
    try {
      await Share.share({
        message: `${APP_LINKS.SHARE_MESSAGE} ${url}`,
        url: url,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const handleDownloadAPK = async () => {
    try {
      await Linking.openURL(APP_LINKS.DOWNLOAD_URL);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      Alert.alert("Link Error", "Could not open download link.");
    }
  };

  const handleCopyLink = async () => {
    const url = APP_LINKS.getShareUrl();
    await Clipboard.setStringAsync(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Link Copied!", "Public app link copied to clipboard. Share it to show others the project.");
  };

  const STATS = [
    { label: t("shieldedScans"), value: profile.emailsScanned, icon: "shield-check", color: theme.cyan },
    { label: t("threatsNeutralized"), value: profile.scamsDetected, icon: "target", color: theme.red },
    { label: t("trainingScore"), value: profile.gameScore, icon: "trophy", color: theme.yellow },
    { label: t("levelsCompleted"), value: profile.levelsCompleted, icon: "lightning-bolt", color: theme.purple },
  ];

  const PROFILE_TYPES: ProfileType[] = ["Personal", "Business", "Family"];

  const renderBadge = ({ item }: { item: Badge }) => (
    <View style={styles.badgeItem}>
      <CyberCard 
        glowColor={item.earned ? theme.cyan : theme.border} 
        style={[styles.badgeCard, { backgroundColor: theme.surface }, !item.earned && styles.badgeCardLocked]}
      >
        <Text style={[styles.badgeIcon, !item.earned && styles.badgeIconLocked]}>
          {item.icon}
        </Text>
        <Text style={[styles.badgeName, { color: item.earned ? theme.text : theme.textDim }]}>
          {item.name}
        </Text>
        {item.earned && (
            <Text style={[styles.badgeDate, { color: theme.cyan }]}>{item.earnedDate}</Text>
        )}
      </CyberCard>
    </View>
  );

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.background }]}>
      <GridBackdrop theme={theme} />
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cyber-ID Profile Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <CyberCard glowColor={theme.cyan} style={styles.idCard}>
            <LinearGradient
               colors={[theme.surface, theme.surfaceElevated]}
               style={styles.idCardGradient}
            >
              <View style={styles.idCardHeader}>
                 <Text style={[styles.idCardLabel, { color: theme.cyan }]}>SECURE_IDENTITY_CARD</Text>
                 <MaterialCommunityIcons name="integrated-circuit-chip" size={24} color={theme.yellow} />
              </View>

              <View style={styles.profileRow}>
                <View style={styles.avatarWrapper}>
                   <View style={[styles.avatarBackglow, { shadowColor: profile.customAvatar ? theme.cyan : selectedAvatar.color }]} />
                   <TouchableOpacity 
                     style={[styles.avatarCircle, { borderColor: profile.customAvatar ? theme.cyan : selectedAvatar.color, backgroundColor: theme.surface, overflow: 'hidden' }]}
                     onPress={() => setShowAvatarModal(true)}
                   >
                     {profile.customAvatar ? (
                       <Image source={{ uri: profile.customAvatar }} style={{ width: '100%', height: '100%' }} />
                     ) : (
                       <Text style={styles.avatarEmoji}>{selectedAvatar.emoji}</Text>
                     )}
                   </TouchableOpacity>
                   <Animated.View style={[styles.scanningBar, { backgroundColor: theme.cyan }, scanBarStyle]} />
                </View>

                <View style={styles.profileInfo}>
                  <Text style={[styles.userName, { color: theme.text }]}>{profile.customAvatar ? "Elite Agent" : selectedAvatar.name}</Text>
                  <View style={[styles.rankBadge, { backgroundColor: theme.red + "20", borderColor: theme.red + "40" }]}>
                    <Text style={[styles.rankText, { color: theme.red }]}>LEVEL_07 DEFENDER</Text>
                  </View>
                  <Text style={[styles.idSerial, { color: theme.textDim }]}>ID: SHLD-8821-X99</Text>
                </View>
              </View>

              <View style={styles.idCardFooter}>
                 <View style={styles.connectionDot} />
                 <Text style={[styles.connectionText, { color: theme.cyan }]}>NEURAL_LINK_STABLE</Text>
                 <TouchableOpacity 
                    style={styles.themeToggle} 
                    onPress={() => {
                        toggleTheme();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                  >
                    <MaterialCommunityIcons 
                      name={profile.isDarkMode ? "weather-sunny" : "weather-night"} 
                      size={18} 
                      color={theme.yellow} 
                    />
                  </TouchableOpacity>
              </View>
            </LinearGradient>
          </CyberCard>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          {STATS.map((stat, i) => (
            <Animated.View key={i} entering={FadeInUp.delay(200 + i * 100)} style={styles.statItem}>
              <CyberCard glowColor={stat.color + '30'} style={[styles.statCard, { backgroundColor: theme.surface }]}>
                <View style={styles.statContent}>
                   <MaterialCommunityIcons name={stat.icon as any} size={20} color={stat.color} />
                   <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                   <Text style={[styles.statLabel, { color: theme.textDim }]}>{stat.label}</Text>
                </View>
                {/* Subtle Holo Pattern */}
                <View style={[styles.holoOverlay, { backgroundColor: stat.color + '05' }]} />
              </CyberCard>
            </Animated.View>
          ))}
        </View>

        {/* Profile Type Settings */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.textDim }]}>{t("profileType") || "PROFILE TYPE"}</Text>
          <View style={styles.typeRow}>
            {PROFILE_TYPES.map((type) => (
              <TouchableOpacity 
                key={type}
                onPress={() => {
                    setProfileType(type);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.typeBtn, 
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  profile.profileType === type && { borderColor: theme.cyan, backgroundColor: theme.cyan + "10" }
                ]}
              >
                <Text style={[
                  styles.typeText, 
                  { color: theme.textSecondary },
                  profile.profileType === type && { color: theme.cyan, fontFamily: "Inter_700Bold" }
                ]}>
                  {t(type.toLowerCase()) || type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Direct App Link Section */}
        <View style={styles.settingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textDim }]}>{t('distTitle') || "SHIELD_ACCESS & DISTRIBUTION"}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => setQrType("download")} style={qrType === "download" ? { borderBottomWidth: 1, borderBottomColor: theme.cyan } : { opacity: 0.5 }}>
                   <Text style={{ fontSize: 9, color: theme.cyan, fontFamily: 'Inter_900Black' }}>{t('getApp') || "GET THE APP"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setQrType("sync")} style={qrType === "sync" ? { borderBottomWidth: 1, borderBottomColor: theme.yellow } : { opacity: 0.5 }}>
                   <Text style={{ fontSize: 9, color: theme.yellow, fontFamily: 'Inter_900Black' }}>{t('syncDevice') || "SYNC DEVICE"}</Text>
                </TouchableOpacity>
            </View>
          </View>
          <CyberCard glowColor={qrType === "download" ? theme.cyan : theme.yellow} style={[{ backgroundColor: theme.surface, padding: 20 }]}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
               <View style={{ padding: 12, backgroundColor: 'white', borderRadius: 12, marginBottom: 15 }}>
                  <QRCode
                    value={qrType === "download" ? APP_LINKS.WEB_LANDING_URL : APP_LINKS.getDeepLink()}
                    size={140}
                    color="#0F172A"
                    backgroundColor="white"
                  />
               </View>
               <Text style={[styles.idSerial, { color: theme.textDim, textAlign: 'center', textTransform: 'uppercase' }]}>
                  {qrType === "download" ? t('scanToDownload') : t('scanToSync')}
               </Text>
               <Text style={[styles.idSerial, { color: qrType === "download" ? theme.cyan : theme.yellow, fontSize: 8, marginTop: 4, letterSpacing: 1 }]}>
                  {qrType === "download" ? "COMPATIBLE WITH ANDROID / IOS" : "REQUIRES APP TO BE INSTALLED"}
               </Text>
            </View>

            <View style={{ gap: 12 }}>
              <View style={styles.accessRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accessLabel, { color: theme.text }]}>
                    {qrType === "download" ? "Official Portal URL" : "App Deep Link"}
                  </Text>
                  <Text style={[styles.accessValue, { color: theme.textDim }]} numberOfLines={1}>
                    {qrType === "download" ? APP_LINKS.WEB_LANDING_URL : APP_LINKS.getDeepLink()}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCopyLink} style={[styles.accessBtn, { backgroundColor: theme.cyan + "20", borderColor: theme.cyan + "40" }]}>
                  <MaterialCommunityIcons name="content-copy" size={18} color={theme.cyan} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                   onPress={handleDownloadAPK} 
                   style={[styles.actionBtn, { flex: 1.5, backgroundColor: theme.cyan + "15", borderColor: theme.cyan + "40" }]}
                >
                   <MaterialCommunityIcons name="cloud-download-outline" size={20} color={theme.cyan} />
                   <Text style={[styles.actionBtnText, { color: theme.cyan }]}>{t('downloadApk') || "DOWNLOAD APK"}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                   onPress={handleShareApp} 
                   style={[styles.actionBtn, { flex: 1, backgroundColor: theme.purple + "15", borderColor: theme.purple + "40" }]}
                >
                   <MaterialCommunityIcons name="share-variant" size={20} color={theme.purple} />
                   <Text style={[styles.actionBtnText, { color: theme.purple }]}>{t('shareApp') || "SHARE"}</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={{ fontSize: 9, color: theme.textDim, textAlign: 'center', fontStyle: 'italic', marginTop: 5 }}>
                {t('wifiWarning') || "Ensure your mobile is on the same WiFi as the Shield server."}
              </Text>
            </View>
          </CyberCard>
        </View>

        {/* Account Options */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.textDim }]}>{t("accountOptions") || "ACCOUNT OPTIONS"}</Text>
          <CyberCard glowColor={theme.border} style={[{ backgroundColor: theme.surface, padding: 5 }]}>
            {[
              { id: 'instructions', icon: 'book-open-page-variant', label: t("instructions") || "How to Use App", route: "/InstructionsScreen" },
              { id: 'edit', icon: 'account-edit', label: t("editProfile") || "Edit Profile" },
              { id: 'notifications', icon: 'bell-outline', label: t("notifications") || "Notifications" },
              { id: 'language', icon: 'translate', label: t("changeLanguage") || "Change Language" },
              { id: 'privacy', icon: 'shield-account', label: t("privacySecurity") || "Privacy & Security" },
              { id: 'support', icon: 'help-circle-outline', label: t("helpSupport") || "Help & Support" },
            ].map((opt, i, arr) => (
              <TouchableOpacity 
                key={opt.id}
                onPress={() => {
                   if (opt.id === 'language') setShowLanguageModal(true);
                   else if (opt.route) router.push(opt.route as any);
                   else router.push({ pathname: "/AccountSettingsScreen", params: { title: opt.label } });
                }}
                style={[
                  styles.languageItem, 
                  i !== arr.length - 1 && { borderBottomColor: theme.border + "50" }
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  <MaterialCommunityIcons name={opt.icon as any} size={20} color={theme.textSecondary} />
                  <Text style={[styles.languageText, { color: theme.textSecondary }]}>
                    {opt.label} {opt.id === 'language' ? `(${profile.language})` : ''}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textDim} />
              </TouchableOpacity>
            ))}
          </CyberCard>
        </View>

        {/* Recent Scans History */}
        {profile.scanHistory && profile.scanHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.sectionTitle, { color: theme.textDim }]}>{t("recentScans")}</Text>
            {profile.scanHistory.slice(0, 5).map((scan) => (
              <CyberCard key={scan.id} glowColor={scan.result.riskLevel === "High Risk" ? theme.red : theme.border} style={[styles.historyCard, { backgroundColor: theme.surface }]}>
                <View style={styles.historyHeader}>
                  <MaterialCommunityIcons 
                    name={scan.result.riskLevel === "High Risk" ? "shield-alert" : "shield-check"} 
                    size={18} 
                    color={scan.result.riskLevel === "High Risk" ? theme.red : theme.green} 
                  />
                  <Text style={[styles.historyDate, { color: theme.textDim }]}>{scan.timestamp}</Text>
                </View>
                <Text style={[styles.historyText, { color: theme.text }]} numberOfLines={1}>{scan.text}</Text>
                <Text style={[styles.historyResult, { color: scan.result.riskLevel === "High Risk" ? theme.red : theme.green }]}>
                  {scan.result.riskLevel.toUpperCase()} • {scan.result.riskScore}% RISK
                </Text>
              </CyberCard>
            ))}
          </View>
        )}

        {/* Badges Section */}
        <View style={styles.badgesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textDim }]}>{t("achievementLog")}</Text>
            <Text style={[styles.badgeCount, { color: theme.cyan }]}>
              {profile.badges.filter(b => b.earned).length}/{profile.badges.length}
            </Text>
          </View>

          <FlatList
            data={profile.badges}
            renderItem={renderBadge}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.badgeGrid}
          />
        </View>

      </ScrollView>

      {/* Modals outside ScrollView */}
      <Modal visible={showAvatarModal} transparent animationType="fade" onRequestClose={() => setShowAvatarModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t("selectAvatar") || "Select Avatar"}</Text>
            
            <TouchableOpacity onPress={pickImage} style={[styles.uploadBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <MaterialCommunityIcons name="camera-plus" size={24} color={theme.textSecondary} style={{ marginRight: 10 }} />
               <Text style={[styles.uploadBtnText, { color: theme.textSecondary }]}>{t("pickImage") || "Scan from Gallery"}</Text>
            </TouchableOpacity>

            <View style={styles.avatarGrid}>
              {AVATARS.map((a) => (
                <TouchableOpacity 
                  key={a.id}
                  onPress={() => { setAvatar(a.id); setCustomAvatar(undefined); setShowAvatarModal(false); }}
                  style={[
                    styles.avatarOption,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    profile.selectedAvatar === a.id && !profile.customAvatar && { borderColor: theme.cyan, backgroundColor: theme.cyan + "20" }
                  ]}
                >
                  <Text style={styles.avatarOptionEmoji}>{a.emoji}</Text>
                  <Text style={[styles.avatarOptionName, { color: theme.textSecondary }]}>{a.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowAvatarModal(false)} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
              <Text style={[styles.closeBtnText, { color: theme.text }]}>{t("back") || "Back"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showQRModal} transparent animationType="slide" onRequestClose={() => setShowQRModal(false)}>
        <View style={styles.modalOverlay}>
           <CyberCard glowColor={theme.yellow} style={[styles.modalContent, { backgroundColor: theme.background, alignItems: 'center' }]}>
              <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 10 }]}>SHIELD_ACCESS_QR</Text>
              <Text style={[styles.statLabel, { color: theme.textDim, marginBottom: 20 }]}>SCAN TO OPEN APP ON MOBILE</Text>
              
              <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 12 }}>
                <QRCode
                  value={Linking.createURL("")}
                  size={200}
                  color="#0F172A"
                  backgroundColor="white"
                />
              </View>
              
              <Text style={[styles.idSerial, { color: theme.textDim, marginTop: 20, textAlign: 'center' }]}>
                {Linking.createURL("")}
              </Text>

              <TouchableOpacity onPress={() => setShowQRModal(false)} style={[styles.closeBtn, { backgroundColor: theme.surface, width: '100%', marginTop: 30 }]}>
                <Text style={[styles.closeBtnText, { color: theme.text }]}>CLOSE ENCRYPTED ACCESS</Text>
              </TouchableOpacity>
           </CyberCard>
        </View>
      </Modal>

      <Modal visible={showLanguageModal} transparent animationType="fade" onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: theme.border, padding: 0, paddingVertical: 20 }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t("languageSettings") || "Select Language"}</Text>
            <ScrollView style={{ maxHeight: 400, paddingHorizontal: 20 }}>
              {Object.keys(translations).map((lang) => (
                <TouchableOpacity 
                  key={lang}
                  onPress={() => { setLanguage(lang); setShowLanguageModal(false); }}
                  style={[
                    styles.languageItem, 
                    { borderBottomColor: theme.border + "50" },
                    profile.language === lang && { backgroundColor: theme.cyan + "15", borderColor: theme.cyan }
                  ]}
                >
                  <Text style={[
                    styles.languageText,
                    { color: theme.textSecondary },
                    profile.language === lang && { color: theme.cyan, fontFamily: "Inter_700Bold" }
                  ]}>
                    {lang}
                  </Text>
                  {profile.language === lang && (
                    <MaterialCommunityIcons name="check-circle" size={18} color={theme.cyan} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)} style={[styles.closeBtn, { backgroundColor: theme.surface, marginHorizontal: 20 }]}>
              <Text style={[styles.closeBtnText, { color: theme.text }]}>{t("back") || "Back"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function GridBackdrop({ theme }: { theme: any }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
       {/* Background Glow */}
       <View style={[styles.mainGlow, { shadowColor: theme.cyan }]} />
       {/* Grid Lines */}
       <View style={styles.gridContainer}>
          {[...Array(15)].map((_, i) => (
             <View key={i} style={[styles.gridLine, { top: i * 80, backgroundColor: theme.border + '15' }]} />
          ))}
          {[...Array(10)].map((_, i) => (
             <View key={i} style={[styles.gridColumn, { left: i * 60, backgroundColor: theme.border + '15' }]} />
          ))}
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  mainGlow: {
    position: 'absolute',
    top: -100,
    left: '50%',
    width: 300,
    height: 300,
    borderRadius: 150,
    marginLeft: -150,
    opacity: 0.1,
    shadowRadius: 100,
    shadowOpacity: 0.8,
    elevation: 20,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    width: '100%',
  },
  gridColumn: {
    position: 'absolute',
    width: 1,
    height: '100%',
  },
  idCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  idCardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  idCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  idCardLabel: {
    fontSize: 8,
    fontFamily: 'Inter_900Black',
    letterSpacing: 2,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBackglow: {
    position: "absolute",
    width: 60,
    height: 60,
    top: 20,
    borderRadius: 30,
    shadowRadius: 40,
    shadowOpacity: 0.8,
    elevation: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },
  avatarEmoji: {
    fontSize: 50,
  },
  scanningBar: {
    position: 'absolute',
    height: 2,
    width: 60,
    left: 20,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  rankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  rankText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
  },
  idSerial: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
    opacity: 0.6,
  },
  idCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FFFF',
    marginRight: 6,
  },
  connectionText: {
    fontSize: 7,
    fontFamily: 'Inter_900Black',
    flex: 1,
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 20,
    gap: 6,
  },
  accessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  accessLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    marginBottom: 2,
  },
  accessValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    opacity: 0.8,
  },
  accessBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginVertical: 20,
  },
  statItem: {
    width: (width - 52) / 2,
  },
  statCard: {
    padding: 15,
    alignItems: "center",
    gap: 5,
    overflow: 'hidden',
  },
  statContent: {
    alignItems: 'center',
    zIndex: 10,
    gap: 5,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
  },
  statLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  holoOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
  },
  settingsSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 15,
    textTransform: "uppercase",
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  typeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  languageText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  historySection: {
    marginBottom: 25,
  },
  historyCard: {
    padding: 12,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  historyDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
  },
  historyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginBottom: 4,
  },
  historyResult: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
  },
  badgesSection: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  badgeCount: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  badgeGrid: {
    gap: 12,
  },
  badgeItem: {
    flex: 0.5,
    padding: 6,
  },
  badgeCard: {
    padding: 15,
    alignItems: "center",
    gap: 8,
    minHeight: 120,
    justifyContent: "center",
  },
  badgeCardLocked: {
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeIconLocked: {
    opacity: 0.5,
  },
  badgeName: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    textAlign: "center",
  },
  badgeDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    marginTop: 2,
  },
  header: {
    alignItems: "center",
    marginVertical: 10,
    position: "relative",
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    width: "100%",
  },
  uploadBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    justifyContent: "center",
  },
  avatarOption: {
    width: "45%",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  avatarOptionEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  avatarOptionName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  closeBtn: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  closeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
