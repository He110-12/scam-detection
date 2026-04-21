import React, { useState, useRef, useEffect } from "react";
import { 
  View, Text, StyleSheet, TextInput, ScrollView, 
  KeyboardAvoidingView, Platform, Animated as RNAnimated, TouchableOpacity, Image, Alert, Modal, Dimensions, Share
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence 
} from "react-native-reanimated";
import { useProfile } from "@/context/ProfileContext";
import { scanEmailText, ScanResult } from "@/services/scanService";
import { triggerScamAlertNotification } from "@/services/notificationService";
import Colors from "@/constants/colors";
import GlowButton from "@/components/cyber/GlowButton";
import CyberCard from "@/components/cyber/CyberCard";
import RiskMeter from "@/components/cyber/RiskMeter";
import Logo from "@/components/cyber/Logo";
import { APP_LINKS } from "@/constants/links";

const { width } = Dimensions.get("window");

export default function EmailScanner() {
  const { addScanResult, t, profile } = useProfile();
  const [emailText, setEmailText] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanAnim] = useState(new RNAnimated.Value(0));
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scanningLock = useRef(false);
  const terminalTimeouts = useRef<any[]>([]);
  const terminalScrollRef = useRef<ScrollView>(null);

  const theme = profile.isDarkMode ? Colors.dark : Colors.light;

  // Scanning Laser Animation
  const laserPos = useSharedValue(0);
  useEffect(() => {
    laserPos.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    );
  }, []);

  const laserStyle = useAnimatedStyle(() => ({
    top: `${laserPos.value * 100}%`,
  }));

  const terminalSequence = [
    "Initializing secure kernel...",
    "Connecting to I4C Cyber Database...",
    "Analyzing semantic patterns...",
    "Scanning for vishing signatures...",
    "Checking known scam repositories...",
    "Decrypting suspicious links...",
    "Finalizing risk assessment..."
  ];

  const handleScan = async (textToScan: string = emailText, isQR: boolean = false) => {
    if (!textToScan.trim()) return;

    setIsScanning(true);
    setResult(null);
    setTerminalLogs([isQR ? "> Initiating QR signature scan..." : "> Initializing neural text analysis..."]);
    
    terminalTimeouts.current.forEach(clearTimeout);
    terminalTimeouts.current = [];
    
    scanAnim.setValue(0);
    
    const sequence = isQR 
      ? ["Decrypting matrix payload...", "Checking domain reputation...", "Verifying URL entropy...", "Running threat heuristics...", "Finalizing analysis..."]
      : terminalSequence;

    sequence.forEach((log, index) => {
      const timeout = setTimeout(() => {
        setTerminalLogs(prev => [...prev.slice(-12), `> ${log}`]);
        if (index % 2 === 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 250 * (index + 1)) as any;
      terminalTimeouts.current.push(timeout);
    });

    RNAnimated.timing(scanAnim, {
      toValue: 1,
      duration: isQR ? 1800 : 2500,
      useNativeDriver: true,
    }).start(async () => {
      let scanResult: ScanResult;

      try {
        if (profile.backendMode === 'local') {
           scanResult = scanEmailText(textToScan);
        } else {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const res = await fetch(`${profile.backendUrl}/api/alerts/scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textToScan }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!res.ok) throw new Error("Backend scan failed");
          scanResult = await res.json();
        }
      } catch (err) {
        console.warn("Falling back to local heuristic scan engine.");
        scanResult = scanEmailText(textToScan);
      }

      setResult(scanResult);
      setIsScanning(false);
      addScanResult(textToScan, scanResult);
      Haptics.notificationAsync(
        scanResult.riskLevel === "High Risk" 
          ? Haptics.NotificationFeedbackType.Error 
          : Haptics.NotificationFeedbackType.Success
      );
      
      if (scanResult.riskLevel === "High Risk") {
        triggerScamAlertNotification("🚨 Cyber-Shield Warning", "High-risk scam pattern detected. Avoid clicking links: " + scanResult.reasons[0]);
      }
    });
  };

  const handleShareResult = async () => {
    if (!result) return;
    
    const url = APP_LINKS.getShareUrl();
    const message = `🛡️ Cyber Shield Scan Result\n\nRisk Level: ${result.riskLevel.toUpperCase()}\nRisk Score: ${result.riskScore}/100\n\nHeuristic Detection:\n${result.reasons.map(r => `• ${r}`).join('\n')}\n\nScan your own emails with Cyber Shield: ${url}`;
    
    try {
      await Share.share({
        message,
        url: url,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleQRScanPress = async () => {
    setIsCameraInitializing(true);
    try {
      const isAvailable = await CameraView.isAvailableAsync && typeof CameraView.isAvailableAsync === 'function' 
        ? await (CameraView as any).isAvailableAsync() 
        : true;
      
      if (!isAvailable) {
        Alert.alert("Hardware Error", "Camera is not available on this device.");
        return;
      }

      const status = await requestPermission();
      if (!status.granted) {
        Alert.alert(
          "Camera Access Required", 
          "Cyber-Shield needs camera access to scan QR codes for embedded threats.",
          [{ text: "OK" }]
        );
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsCameraVisible(true);
      scanningLock.current = false;
    } catch (err) {
      console.error("Camera Init Error:", err);
      Alert.alert("Scanner Error", "Could not initialize the Cyber-Shield Scanning engine.");
    } finally {
      setIsCameraInitializing(false);
    }
  };

  const handleBarcodeScanned = (scanningResult: BarcodeScanningResult) => {
    if (scanningLock.current) return;
    scanningLock.current = true;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCameraVisible(false);
    setTorchEnabled(false);
    setEmailText(scanningResult.data);
    setTimeout(() => handleScan(scanningResult.data, true), 100);
  };

  const handleClipboardPaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setEmailText(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  useEffect(() => {
    return () => terminalTimeouts.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (isScanning) {
      setTimeout(() => terminalScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [terminalLogs]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to scan images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(result.assets[0].uri);
      setIsScanning(true);
      setTerminalLogs(["> Initiating OCR Machine Learning Extraction..."]);
      
      try {
        const response = await fetch(`${profile.backendUrl}/api/ocr`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: `data:image/jpeg;base64,${result.assets[0].base64}` })
        });
        
        const data = await response.json();
        
        if (data.text && data.text.trim()) {
          setEmailText(data.text);
          setTerminalLogs(prev => [...prev, "> NEURAL EXTRACTION COMPLETE. Transferring data to Threat Engine..."]);
          setTimeout(() => handleScan(data.text), 800);
        } else {
          throw new Error("No readable text found");
        }
      } catch (e) {
        setTerminalLogs(prev => [...prev, "> CRITICAL FAILURE: OCR Engine offline or image encrypted."]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setTimeout(() => setIsScanning(false), 2000);
      }
    }
  };

  const clearScan = () => {
    setEmailText("");
    setResult(null);
    setSelectedImage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "High Risk": return theme.red;
      case "Suspicious": return theme.yellow;
      default: return theme.green;
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Logo size={40} isDarkMode={profile.isDarkMode} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{t("scannerTitle")}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {t("scannerDesc")}
        </Text>
        
        <View style={styles.statsRow}>
          <Text style={[styles.statsText, { color: theme.cyan }]}>
            TOTAL SCANS: <Text style={{ fontFamily: "Inter_900Black" }}>{profile.emailsScanned}</Text>
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.surface, 
              color: theme.text, 
              borderColor: theme.border 
            }]}
            placeholder="Paste email content here..."
            placeholderTextColor={theme.textDim}
            multiline
            value={emailText}
            onChangeText={setEmailText}
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={[styles.pasteBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.cyan + '30' }]} 
            onPress={handleClipboardPaste}
          >
            <MaterialCommunityIcons name="content-paste" size={16} color={theme.cyan} />
            <Text style={{ color: theme.cyan, fontSize: 10, fontFamily: "Inter_700Bold" }}>PASTE</Text>
          </TouchableOpacity>
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.clearImage} onPress={() => setSelectedImage(null)}>
                <MaterialCommunityIcons name="close-circle" size={24} color={theme.red} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.actionSection}>
          <View style={styles.toolbarRow}>
            <TouchableOpacity 
              style={[styles.galleryBtn, { flex: 1, borderColor: theme.cyan }]} 
              onPress={pickImage}
            >
              <MaterialCommunityIcons name="image-plus" size={20} color={theme.cyan} />
              <Text style={[styles.galleryText, { color: theme.cyan }]} numberOfLines={1}>{t("pickImage")}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.galleryBtn, { flex: 1, borderColor: theme.yellow }]} 
              onPress={handleQRScanPress}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={20} color={theme.yellow} />
              <Text style={[styles.galleryText, { color: theme.yellow }]} numberOfLines={1}>QR SCAN</Text>
            </TouchableOpacity>
          </View>

          <GlowButton
            label={isCameraInitializing ? "SECURE_BOOT..." : (isScanning ? t("scanningBtn") : t("analyzeBtn"))}
            onPress={() => handleScan(emailText)}
            disabled={isScanning || isCameraInitializing || !emailText.trim()}
            color={isScanning ? theme.blue : theme.cyan}
            style={{ width: "100%" }}
          />
        </View>

        {isScanning && (
          <View style={[styles.terminalContainer, { backgroundColor: "#000", borderColor: theme.cyan }]}>
            <View style={[styles.terminalHeader, { backgroundColor: theme.cyan }]}>
              <MaterialCommunityIcons name="console" size={14} color="#000" />
              <Text style={styles.terminalHeaderTitle}>SCANNER_LOG v2.6</Text>
            </View>
            <ScrollView 
              style={styles.terminalScroll} 
              contentContainerStyle={styles.terminalLog}
              ref={terminalScrollRef}
            >
              {terminalLogs.map((log, i) => (
                <Text key={i} style={[styles.terminalText, { color: theme.cyan }]}>{log}</Text>
              ))}
              <RNAnimated.View style={{ 
                opacity: scanAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 0, 1]
                }) 
              }}>
                <Text style={[styles.terminalText, { color: theme.cyan }]}>_</Text>
              </RNAnimated.View>
            </ScrollView>
          </View>
        )}

        {result && (
          <View style={styles.resultContainer}>
            <Text style={[styles.resultHeader, { color: theme.textDim }]}>{t("analysisResults")}</Text>
            
            <CyberCard glowColor={getRiskColor(result.riskLevel)} style={[styles.resultCard, { backgroundColor: theme.surface }]}>
              <View style={styles.meterSection}>
                <RiskMeter 
                  score={result.riskScore} 
                  level={
                    result.riskLevel === "High Risk" ? "high" : 
                    result.riskLevel === "Suspicious" ? "suspicious" : "safe"
                  } 
                />
              </View>

              <View style={styles.reasonsSection}>
                <Text style={[styles.sectionLabel, { color: theme.textDim }]}>{t("detectionLog")}</Text>
                {result.reasons.map((reason, i) => (
                  <View key={i} style={styles.reasonRow}>
                    <MaterialCommunityIcons 
                      name="shield-alert-outline" 
                      size={14} 
                      color={getRiskColor(result.riskLevel)} 
                    />
                    <Text style={[styles.reasonText, { color: theme.text }]}>{reason}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.tipSection, { backgroundColor: theme.surfaceElevated, borderLeftColor: theme.cyan }]}>
                <Text style={[styles.tipLabel, { color: theme.cyan }]}>{t("shieldAdvice")}</Text>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>{result.tip}</Text>
              </View>

              <TouchableOpacity style={styles.clearBtn} onPress={clearScan}>
                <Text style={{ color: theme.textDim, fontFamily: "Inter_600SemiBold" }}>CLEAR RESULTS</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.readBtn, { backgroundColor: theme.purple + '20', borderColor: theme.purple, borderWidth: 1, marginTop: 10 }]} 
                onPress={handleShareResult}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <Ionicons name="share-social" size={16} color={theme.purple} />
                  <Text style={{ color: theme.purple, fontFamily: "Inter_700Bold", fontSize: 12 }}>SHARE THREAT REPORT</Text>
                </View>
              </TouchableOpacity>
            </CyberCard>
          </View>
        )}
      </ScrollView>

      {/* Camera Modal */}
      {isCameraVisible && permission?.granted && (
        <View style={styles.fullScreenCamera}>
          <CameraView 
            style={StyleSheet.absoluteFill} 
            facing="back"
            enableTorch={torchEnabled}
            barcodeScannerSettings={{ 
              barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e", "aztec", "pdf417", "datamatrix"]
            }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            <View style={styles.cameraContent}>
                <View style={[styles.scannerFrame, { borderColor: theme.cyan + '60' }]}>
                   <View style={styles.frameCornerTopLeft} />
                   <View style={styles.frameCornerTopRight} />
                   <View style={styles.frameCornerBottomLeft} />
                   <View style={styles.frameCornerBottomRight} />
                   <Animated.View style={[styles.scanLaser, { backgroundColor: theme.cyan }, laserStyle]} />
                </View>

                <Text style={styles.scanHintText}>ALIGN SIGNATURE IN FRAME</Text>

                <View style={styles.cameraControlsRow}>
                   <TouchableOpacity 
                     style={styles.cameraActionBtn} 
                     onPress={() => {
                        setTorchEnabled(!torchEnabled);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                     }}
                   >
                      <MaterialCommunityIcons 
                        name={torchEnabled ? "flashlight" : "flashlight-off"} 
                        size={28} 
                        color={torchEnabled ? theme.yellow : "#FFF"} 
                      />
                      <Text style={styles.cameraActionLabel}>TORCH</Text>
                   </TouchableOpacity>

                   <TouchableOpacity 
                     style={[styles.cameraActionBtn, { backgroundColor: 'rgba(255,0,0,0.3)' }]} 
                     onPress={() => setIsCameraVisible(false)}
                   >
                      <MaterialCommunityIcons name="close" size={28} color="#FFF" />
                      <Text style={styles.cameraActionLabel}>EXIT</Text>
                   </TouchableOpacity>
                </View>
            </View>
          </CameraView>
        </View>
      )}

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    textAlign: "center",
    marginTop: 10,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  statsRow: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: -10,
  },
  statsText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 20,
    position: "relative",
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    borderRadius: 8,
    padding: 16,
    minHeight: 180,
    textAlignVertical: "top",
    borderWidth: 1,
  },
  pasteBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  imagePreviewContainer: {
    position: "absolute",
    bottom: 15,
    right: 15,
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFF",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  clearImage: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  actionSection: {
    gap: 12,
  },
  toolbarRow: {
    flexDirection: "row",
    gap: 12,
  },
  galleryBtn: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderStyle: "dashed",
  },
  galleryText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  terminalContainer: {
    marginTop: 20,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    height: 180,
  },
  terminalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 8,
  },
  terminalHeaderTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 10,
    color: "#000",
  },
  terminalScroll: {
    flex: 1,
  },
  terminalLog: {
    padding: 12,
  },
  terminalText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 9,
    lineHeight: 12,
    marginBottom: 2,
  },
  resultContainer: {
    marginTop: 30,
    gap: 12,
  },
  resultHeader: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 2,
    textAlign: "center",
    textTransform: "uppercase",
  },
  resultCard: {
    padding: 20,
  },
  meterSection: {
    marginBottom: 20,
  },
  reasonsSection: {
    marginBottom: 20,
    gap: 8,
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reasonText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  tipSection: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  tipLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    marginBottom: 4,
  },
  tipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  fullScreenCamera: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: '#000',
  },
  cameraContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scannerFrame: {
    width: 260,
    height: 260,
    borderWidth: 1,
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  frameCornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderColor: '#00FFFF',
    borderTopLeftRadius: 20,
  },
  frameCornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderColor: '#00FFFF',
    borderTopRightRadius: 20,
  },
  frameCornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderColor: '#00FFFF',
    borderBottomLeftRadius: 20,
  },
  frameCornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderColor: '#00FFFF',
    borderBottomRightRadius: 20,
  },
  scanLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
  scanHintText: {
    color: '#00FFFF',
    fontFamily: "Inter_900Black",
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 30,
    textShadowColor: 'rgba(0,255,255,0.5)',
    textShadowRadius: 10,
  },
  cameraControlsRow: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 60,
  },
  cameraActionBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cameraActionLabel: {
    color: '#FFF',
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    marginTop: 5,
    letterSpacing: 1,
  },
  historyContainer: {
    marginTop: 40,
  },
  historyHeader: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    marginBottom: 15,
    letterSpacing: 1,
  },
  historyCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  historyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
  },
  historySnippet: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  readBtn: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
