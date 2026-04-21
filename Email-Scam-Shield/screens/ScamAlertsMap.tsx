import React, { useState, useRef, useMemo } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Animated, Dimensions, Image, StatusBar, Linking, Platform, Modal
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { INDIA_STATES, ScamAlert, SCAM_DATA } from "@/data/scamData";
import { useProfile } from "@/context/ProfileContext";
import Colors from "@/constants/colors";
import CyberCard from "@/components/cyber/CyberCard";
import GlowButton from "@/components/cyber/GlowButton";
import { ScrollView } from "react-native";

const { width } = Dimensions.get("window");

import Constants from "expo-constants";

export default function ScamAlertsMap() {
  const { addStateViewed, t, profile } = useProfile();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [liveScams, setLiveScams] = useState<ScamAlert[]>([]);
  const [dataSource, setDataSource] = useState<"static" | "live">("live");
  const [isFetchingLiveNews, setIsFetchingLiveNews] = useState(false);
  const [yearRangeMode, setYearRangeMode] = useState<"last20" | "all">("last20");
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showGuide, setShowGuide] = useState(false);

  const currentYear = new Date().getFullYear();
  // Keep a 20-year window through the current year (inclusive)
  const twentyYearCutoff = currentYear - 19;

  // Use theme colors
  const theme = profile.isDarkMode ? Colors.dark : Colors.light;

  const availableYears = useMemo(() => {
    if (!selectedState) return [];
    try {
      let activeList = [];
      if (dataSource === "static") {
        activeList = SCAM_DATA.filter(s => s.state === selectedState);
      } else {
        activeList = liveScams;
      }

      if (yearRangeMode === "last20") {
        activeList = activeList.filter(s => s.year >= twentyYearCutoff);
      }

      const years = activeList.map(s => s.year);
      return Array.from(new Set(years)).sort((a, b) => (b as number) - (a as number));
    } catch (e) {
      return [];
    }
  }, [selectedState, liveScams, dataSource, yearRangeMode]);

  const filteredScams = useMemo(() => {
    if (!selectedState) return [];
    try {
      let activeList = [];
      if (dataSource === "static") {
        activeList = SCAM_DATA.filter(s => s.state === selectedState);
      } else {
        activeList = liveScams;
      }

      if (yearRangeMode === "last20") {
        activeList = activeList.filter(s => s.year >= twentyYearCutoff);
      }
      
      if (selectedYear) {
        activeList = activeList.filter(s => s.year === selectedYear);
      }
      return activeList;
    } catch (e) {
      return [];
    }
  }, [selectedState, selectedYear, liveScams, dataSource, yearRangeMode]);

  const fetchLiveNews = async (state: string) => {
    setIsFetchingLiveNews(true);
    try {
      // Dynamically extract the host IP from Expo using regex, fallback to Wi-Fi IP
      const hostUri = Constants.expoConfig?.hostUri;
      let host = "192.168.1.2";
      if (hostUri) {
        const ipMatch = hostUri.match(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/);
        if (ipMatch && ipMatch[0]) host = ipMatch[0];
      }

      const url = `http://${host}:5000/api/alerts/state/${encodeURIComponent(state)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!Array.isArray(data)) {
         throw new Error("Invalid response format from backend");
      }
      
      const parsedScams: ScamAlert[] = data.map((item: any, index: number) => ({
        id: item._id || `backend-${index}`,
        state: item.state,
        city: "Various",
        year: item.publishedAt ? new Date(item.publishedAt).getFullYear() : new Date().getFullYear(),
        title: item.title,
        description: item.description || "Live update from ScamShield Backend. Automatically fetched.",
        example: "Click the article link below to read the full report.",
        prevention: "Stay vigilant against new and emerging threats in your region.",
        date: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("en-IN", { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently",
        severity: item.threat_level === "high" ? "High" : item.threat_level === "low" ? "Low" : "Medium",
        category: (item.category || "Misc").toUpperCase(),
        source: item.source || "News Portal",
        sourceUrl: item.url,
        image: item.image || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop"
      }));
      
      setLiveScams(parsedScams);
    } catch(e) {
      console.log("Error fetching news from backend:", e);
      setLiveScams([]);
    } finally {
      setIsFetchingLiveNews(false);
    }
  };

  const handleStateSelect = (state: string) => {
    addStateViewed(state);
    
    // Animate transition
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedState(state);
      setSelectedYear(null);

      // Clear list and refetch for live mode
      setLiveScams([]);
      if (dataSource === "live") {
        fetchLiveNews(state);
      }

      slideAnim.setValue(width);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const resetSelection = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedState(null);
      setSelectedYear(null);
    });
  };

  const renderNewspaperItem = ({ item, index }: { item: ScamAlert; index: number }) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.newsItem}>
      <CyberCard 
        glowColor={index === 0 ? theme.red : theme.border} 
        style={[styles.newsCard, { backgroundColor: theme.surface }]}
      >
        {index === 0 && (
          <View style={[styles.breakingBadge, { backgroundColor: theme.red }]}>
            <Text style={styles.breakingText}>{t("breakingNews")}</Text>
          </View>
        )}
        
        {item.image && (
          <View style={styles.imageWrapper}>
            <Image 
              source={{ uri: item.image }} 
              style={styles.newsImage} 
              resizeMode="cover"
            />
            {item.source && (
              <View style={[styles.sourceBadge, { backgroundColor: theme.surface + "CC" }]}>
                <MaterialCommunityIcons name="newspaper-variant-outline" size={12} color={theme.text} />
                <Text style={[styles.sourceText, { color: theme.text }]}>{item.source}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.newsContent}>
          <View style={styles.newsMeta}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialCommunityIcons name="map-marker" size={12} color={theme.cyan} />
              <Text style={[styles.newsCategory, { color: theme.cyan }]}>
                {item.category.toUpperCase()} • {item.city}
              </Text>
            </View>
            <Text style={[styles.newsDate, { color: theme.textDim }]}>{item.date}</Text>
          </View>

          <Text style={[styles.newsTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.newsSnippet, { color: theme.textSecondary }]} numberOfLines={3}>
            {item.description}
          </Text>

          <View style={[styles.preventionBox, { backgroundColor: theme.surfaceElevated, borderLeftColor: theme.cyan }]}>
            <Text style={[styles.preventionLabel, { color: theme.cyan }]}>{t("preventionTip")}</Text>
            <Text style={[styles.preventionText, { color: theme.text }]} numberOfLines={2}>
              {item.prevention}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.moreBtn} 
            onPress={() => {
              const targetUrl = item.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(item.title + " scam news")}`;
              Linking.openURL(targetUrl);
            }}
          >
            <Text style={[styles.moreText, { color: theme.blue }]}>{t("readFullArticle")}</Text>
          </TouchableOpacity>
        </View>
      </CyberCard>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={profile.isDarkMode ? "light-content" : "dark-content"} />
      
      {!selectedState ? (
        <Animated.View style={[styles.mapContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={[styles.infoBtn, { backgroundColor: theme.surface }]}
            onPress={() => setShowGuide(true)}
          >
            <MaterialCommunityIcons name="information-variant" size={24} color={theme.cyan} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{t("regionalAlerts")}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t("selectState")}</Text>
          
          <FlatList
            key="state-list"
            data={INDIA_STATES}
            numColumns={2}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.stateItem} 
                onPress={() => handleStateSelect(item)}
                activeOpacity={0.7}
              >
                <CyberCard glowColor={theme.border} style={[styles.stateCard, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.stateName, { color: theme.text }]}>{item}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={theme.cyan} />
                </CyberCard>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.alertsContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          <View style={[styles.alertsHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={resetSelection} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.cyan} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertsTitle, { color: theme.cyan }]}>{selectedState}</Text>
              <View style={styles.countRow}>
                <Text style={[styles.alertsSubtitle, { color: theme.textDim }]}>{selectedYear ? `${selectedYear} ${t("archivalData")}` : yearRangeMode === "last20" ? t("past20Years") : t("allTime")}</Text>
                {isFetchingLiveNews && (
                  <View style={[{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: theme.yellow + "20" }]}>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 9, color: theme.yellow }}>SYNCING NEWS...</Text>
                  </View>
                )}
                <View style={[styles.countBadge, { backgroundColor: theme.red + "20" }]}>
                  <Text style={[styles.countText, { color: theme.red }]}>{filteredScams.length} ALERTS</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Data Source Toggle */}
          <View style={[styles.toggleContainer, { backgroundColor: theme.surface }]}>
            <TouchableOpacity 
              style={[styles.toggleBtn, dataSource === "live" && { backgroundColor: theme.cyan + "20", borderColor: theme.cyan }]}
              onPress={() => { 
                setDataSource("live"); 
                setSelectedYear(null);
                if (selectedState && liveScams.length === 0) {
                  fetchLiveNews(selectedState);
                }
              }}
            >
              <MaterialCommunityIcons name="broadcast" size={16} color={dataSource === "live" ? theme.cyan : theme.textSecondary} />
              <Text style={[styles.toggleText, { color: dataSource === "live" ? theme.cyan : theme.textSecondary }]}>LIVE ALERTS</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, dataSource === "static" && { backgroundColor: theme.purple + "20", borderColor: theme.purple }]}
              onPress={() => { setDataSource("static"); setSelectedYear(null); }}
            >
              <MaterialCommunityIcons name="database" size={16} color={dataSource === "static" ? theme.purple : theme.textSecondary} />
              <Text style={[styles.toggleText, { color: dataSource === "static" ? theme.purple : theme.textSecondary }]}>DATABASE</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.yearRangeMode, { backgroundColor: theme.surface }]}> 
            <TouchableOpacity
              style={[styles.yearRangeBtn, yearRangeMode === "last20" && { borderColor: theme.cyan, backgroundColor: theme.cyan + "20" }]}
              onPress={() => { setYearRangeMode("last20"); setSelectedYear(null);} }
            >
              <Text style={[styles.yearRangeText, { color: yearRangeMode === "last20" ? theme.cyan : theme.textSecondary }]}>{t("last20Years")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.yearRangeBtn, yearRangeMode === "all" && { borderColor: theme.purple, backgroundColor: theme.purple + "20" }]}
              onPress={() => { setYearRangeMode("all"); setSelectedYear(null);} }
            >
              <Text style={[styles.yearRangeText, { color: yearRangeMode === "all" ? theme.purple : theme.textSecondary }]}>{t("allTime")}</Text>
            </TouchableOpacity>
          </View>

          {availableYears.length > 0 && (
            <View style={[styles.yearFilter, { borderBottomColor: theme.border }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearScroll}>
                <TouchableOpacity 
                  onPress={() => setSelectedYear(null)}
                  style={[styles.yearTab, !selectedYear && { backgroundColor: theme.cyan + "20", borderColor: theme.cyan }]}
                >
                  <Text style={[styles.yearTabText, { color: !selectedYear ? theme.cyan : theme.textSecondary }]}>{t("allYears")}</Text>
                </TouchableOpacity>
                {availableYears.map(year => (
                  <TouchableOpacity 
                    key={year}
                    onPress={() => setSelectedYear(year)}
                    style={[styles.yearTab, selectedYear === year && { backgroundColor: theme.cyan + "20", borderColor: theme.cyan }]}
                  >
                    <Text style={[styles.yearTabText, { color: selectedYear === year ? theme.cyan : theme.textSecondary }]}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <FlatList
            key="alerts-list"
            data={filteredScams}
            renderItem={renderNewspaperItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.newsFeedList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="alert-decagram-outline" size={60} color={theme.textDim} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>{t("noAlertsFound")}</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>{t("tryAnotherYear")}</Text>
                <GlowButton 
                  label={t("allYears")} 
                  onPress={() => setSelectedYear(null)} 
                  color={theme.cyan} 
                  style={{ marginTop: 20 }}
                />
              </View>
            )}
          />

          <View style={styles.footer}>
            <GlowButton 
              label={t("changeRegion")} 
              onPress={resetSelection} 
              color={theme.blue} 
            />
          </View>
        </Animated.View>
      )}

      {/* How to Use Modal */}
      <Modal visible={showGuide} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 15 }}>
              <MaterialCommunityIcons name="information" size={24} color={theme.cyan} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>How to Use Dashboard</Text>
            </View>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              1. <Text style={{ color: theme.text, fontFamily: "Inter_700Bold" }}>Select a State</Text> from the map list to view localized scam reports.{'\n\n'}
              2. <Text style={{ color: theme.text, fontFamily: "Inter_700Bold" }}>Live vs Database</Text>: Toggle between recent real-time news vs up to 20 years of historical archive.{'\n\n'}
              3. <Text style={{ color: theme.text, fontFamily: "Inter_700Bold" }}>Filter by Year</Text>: Keep track of scams based on the year they happened using the top slider.{'\n\n'}
              4. <Text style={{ color: theme.text, fontFamily: "Inter_700Bold" }}>Read More</Text>: Click any article to open Google search or the direct news link for more details.
            </Text>
            <GlowButton label="Got it" onPress={() => setShowGuide(false)} color={theme.cyan} style={{ marginTop: 20, alignSelf: "center", minWidth: 120 }} />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    padding: 20,
    position: "relative",
  },
  infoBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    textAlign: "center",
    marginTop: 30,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  stateItem: {
    flex: 0.5,
    padding: 6,
  },
  stateCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    height: 60,
  },
  stateName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    flex: 1,
  },
  alertsContainer: {
    flex: 1,
  },
  alertsHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 15,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
  },
  alertsTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  alertsSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
  },
  countText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 9,
    letterSpacing: 1,
  },
  toggleContainer: {
    flexDirection: "row",
    padding: 10,
    gap: 10,
    marginBottom: 5,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  toggleText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  yearFilter: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  yearRangeMode: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 10,
    gap: 10,
  },
  yearRangeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  yearRangeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  yearScroll: {
    paddingHorizontal: 15,
    gap: 10,
  },
  yearTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  yearTabText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 15,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  newsFeedList: {
    padding: 15,
    paddingBottom: 100,
  },
  newsItem: {
    marginBottom: 20,
  },
  newsCard: {
    padding: 0,
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
  },
  sourceBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  sourceText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  breakingBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  breakingText: {
    color: "#FFF",
    fontFamily: "Inter_900Black",
    fontSize: 10,
  },
  newsImage: {
    width: "100%",
    height: 180,
  },
  newsContent: {
    padding: 15,
  },
  newsMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  newsCategory: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  newsDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  newsTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 10,
  },
  newsSnippet: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  preventionBox: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  preventionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    marginBottom: 4,
  },
  preventionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
  },
  moreBtn: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
  },
  moreText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1,
  },
  footer: {
    padding: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
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
    maxWidth: 400,
    borderRadius: 16,
    padding: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  modalText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
  }
});
