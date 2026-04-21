import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Dimensions, Animated as RNAnimated, KeyboardAvoidingView, Platform, Modal, Share, Alert
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, Layout, useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useProfile } from '@/context/ProfileContext';
import { triggerScamAlertNotification } from '@/services/notificationService';
import CyberCard from '@/components/cyber/CyberCard';
import Logo from '@/components/cyber/Logo';
import { APP_LINKS } from '@/constants/links';

const { width } = Dimensions.get('window');
import { INDIA_STATES, SCAM_DATA, getStateStatistics } from '@/data/scamData';
import IndiaMap from '@/components/HighFidelityIndiaMap';

const TABS = ['latest', 'trending', 'historical', 'saved'] as const;
const YEARS = ['All Years', 'Last 5 Years', 'Last 10 Years', 'Last 20 Years'];
const CATEGORIES = ['All Types', 'phishing', 'banking fraud', 'investment scam', 'upi scam', 'digital arrest', 'job fraud', 'online scam', 'betting scam'];
const STATES = ['All States', ...INDIA_STATES];

export default function ScamAlertsDashboard() {
  const { profile, t } = useProfile();
  const theme = profile.isDarkMode ? Colors.dark : Colors.light;

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'latest' | 'trending' | 'historical' | 'saved'>('latest');
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [subscribed, setSubscribed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map'); // Default to map for historical

  const tabIndicator = useSharedValue(0);

  useEffect(() => {
    const index = TABS.indexOf(activeTab);
    tabIndicator.value = withSpring(index * (width - 40) / 4, { damping: 15 });
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicator.value }]
  }));
  const [liveStats, setLiveStats] = useState<Record<string, number>>({});
  const tickerAnim = useRef(new RNAnimated.Value(0)).current;
  const [tickerIndex, setTickerIndex] = useState(0);

  const MOCK_TICKER = [
    "🚨 MASSIVE UPI FRAUD DETECTED IN BENGALURU",
    "🛡️ 1,240 PHISHING DOMAINS NEUTRALIZED TODAY",
    "⚠️ NEW 'DIGITAL ARREST' SCAM REPORTED IN NEW DELHI",
    "🏦 HDFC BANK ADVISES: NEVER SHARE OTP VIA SMS",
    "💎 CRIME BRANCH INVESTIGATES ₹500CR INVESTMENT SCAM",
  ];


  const toggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };
  
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedCategory, setSelectedCategory] = useState('All Types');
  const [selectedState, setSelectedState] = useState('All States');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const filterMockData = (data: any[], yearStr: string, cat: string, st: string) => {
    return data.filter(d => {
      let match = true;
      if (st !== 'All States' && d.state !== st) match = false;
      if (cat !== 'All Types' && d.category !== cat.toLowerCase()) match = false;
      
      if (yearStr !== 'All Years') {
        const y = new Date(d.publishedAt).getFullYear();
        if (yearStr.startsWith('Last')) {
          const numYears = parseInt(yearStr.match(/\d+/)?.[0] || "0");
          const cutoff = new Date().getFullYear() - numYears + 1;
          if (y < cutoff) match = false;
        } else {
          if (y !== parseInt(yearStr)) match = false;
        }
      }
      return match;
    }).sort((a,b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  };

  const fetchAlerts = async (reset = false) => {
    if (reset) {
      setPage(1);
      setHasMore(true);
    }
    setLoading(true);
    let fetchedData: any[] = [];
    
    try {
      // 1. Try Backend Main API
      const qPage = reset ? 1 : page;
      let url = `${profile.backendUrl}/api/alerts/history?page=${qPage}&limit=15`;
      
      if (selectedYear !== 'All Years') url += `&year=${selectedYear}`;
      if (selectedCategory !== 'All Types') url += `&type=${selectedCategory}`;
      if (selectedState !== 'All States') url += `&state=${selectedState}`;
      
      const res = await fetch(url);
      const json = await res.json();
      
      if (json.data && json.data.length > 0) {
        fetchedData = json.data;
        if (json.data.length < 15) setHasMore(false);
      } else {
        throw new Error("No data from backend");
      }
    } catch (err) {
      console.warn("Backend unavailable. Defaulting to Public API + Local Archive Database (20 Years).");
      
      // 2. Local Simulated Archive Database (fallback for 20 years history)
      const mappedMockData = SCAM_DATA.map(d => ({
        _id: d.id,
        title: d.title,
        description: d.description,
        publishedAt: d.date ? new Date(d.date) : new Date(d.year, Math.floor(Math.random() * 12), 1),
        threat_level: d.severity?.toLowerCase() || 'medium',
        category: d.category?.toLowerCase() || 'misc',
        state: d.state,
        url: d.sourceUrl
      }));

      let liveAlerts: any[] = [];
      // 3. Try Public RSS->JSON API directly for live alerts
      if (reset) {
        try {
          const rssQ = 'scam OR fraud OR "betting app" OR "job fraud" OR "upi scam" india';
          const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(rssQ)}&hl=en-IN&gl=IN&ceid=IN:en`;
          const apiRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
          const apiJson = await apiRes.json();
          if (apiJson.items) {
            liveAlerts = apiJson.items.map((item: any) => {
              const lowerTitle = item.title.toLowerCase();
              let classification = 'online scam';
              if (lowerTitle.includes('bet') || lowerTitle.includes('gambling') || lowerTitle.includes('mahadev')) classification = 'betting scam';
              else if (lowerTitle.includes('job') || lowerTitle.includes('work from home') || lowerTitle.includes('hiring') || lowerTitle.includes('recruit')) classification = 'job fraud';
              else if (lowerTitle.includes('upi') || lowerTitle.includes('paytm') || lowerTitle.includes('gpay') || lowerTitle.includes('phonepe')) classification = 'upi scam';
              else if (lowerTitle.includes('bank') || lowerTitle.includes('hdfc') || lowerTitle.includes('sbi')) classification = 'banking fraud';
              else if (lowerTitle.includes('invest') || lowerTitle.includes('trading') || lowerTitle.includes('crypto')) classification = 'investment scam';
              else if (lowerTitle.includes('arrest') || lowerTitle.includes('cbi') || lowerTitle.includes('police')) classification = 'digital arrest';
              
              return {
                _id: item.guid,
                title: item.title,
                description: item.description?.replace(/<[^>]*>?/gm, '').substring(0, 150) + "...",
                publishedAt: new Date(item.pubDate),
                threat_level: classification === 'betting scam' || classification === 'banking fraud' || classification === 'upi scam' ? 'high' : 'medium',
                category: classification,
                state: 'National',
                url: item.link
              };
            });
          }
        } catch (apiErr) {
          console.warn("Public API fetch also failed.");
        }
      }

      // 4. Combine Both and Filter!
      const combinedData = [...liveAlerts, ...mappedMockData];
      fetchedData = filterMockData(combinedData, selectedYear, selectedCategory, selectedState);
      setHasMore(false); // disable pagination since we load everything from mock
    } finally {
      setAlerts(prev => reset ? fetchedData : [...prev, ...fetchedData]);
      setLoading(false);
    }
  };

  const fetchStateStats = async () => {
    try {
      const res = await fetch(`${profile.backendUrl}/api/alerts/stats`);
      const json = await res.json();
      if (json && !json.error) {
        setLiveStats(json);
      }
    } catch (err) {
      console.warn("Could not fetch live stats from backend.");
    }
  };

  useEffect(() => {
    fetchAlerts(true);
    fetchStateStats();
    
    // Ticker Animation
    RNAnimated.loop(
      RNAnimated.timing(tickerAnim, {
        toValue: -width,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    const tickerInterval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % MOCK_TICKER.length);
    }, 10000);

    // Simulate real-time mock notification
    setTimeout(() => {
      setShowToast(true);
      if (subscribed && profile.protectionEnabled !== false) {
        triggerScamAlertNotification("⚠️ NEW ALERT DETECTED", "Financial Fraud spikes in your region");
      }
      setTimeout(() => setShowToast(false), 4000);
    }, 3000);

    return () => clearInterval(tickerInterval);
  }, [selectedYear, selectedCategory, selectedState, subscribed]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (page > 1) fetchAlerts();
  }, [page]);

  const openArticle = async (item: any) => {
    let targetUrl = item.sourceUrl || item.url;
    if (!targetUrl || targetUrl.includes('archive.scamshield.local')) {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent((item.title || "") + " scam news")}`;
    }
    try {
      if (Platform.OS === 'web') {
        window.open(targetUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(targetUrl);
      }
    } catch (e) {
      console.log('Error opening browser', e);
    }
  };

  const handleShareAlert = async (item: any) => {
    const url = APP_LINKS.getShareUrl();
    const message = `🛡️ Cyber Shield Threat Alert!\n\n${item.title}\n\nThreat Level: ${item.threat_level?.toUpperCase()}\nLocation: ${item.state}\n\nStay protected with Cyber Shield: ${url}`;
    
    try {
      await Share.share({
        message,
        url: item.url || url,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const threatColor = (level: string) => {
    if (level === 'high') return theme.red;
    if (level === 'low') return theme.green;
    return theme.yellow;
  };

  const renderFilterChips = (data: string[], selected: string, onSelect: (val: string) => void) => (
    <View style={{ height: 44 }}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={data}
        keyExtractor={(item) => item}
        keyboardShouldPersistTaps="handled"
        // Ensure horizontal gestures are prioritized over parent vertical swipe
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4 }}
        renderItem={({ item }) => {
          const isActive = selected === item;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.chip,
                { 
                  backgroundColor: isActive ? theme.cyan + '30' : theme.surface,
                  borderColor: isActive ? theme.cyan : theme.border
                }
              ]}
              onPress={() => {
                 onSelect(item);
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.chipText, { color: isActive ? theme.cyan : theme.textDim }]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const filteredAlerts = useMemo(() => {
    if (!searchQuery) return alerts;
    const lowerQ = searchQuery.toLowerCase();
    return alerts.filter(a => 
      a.title?.toLowerCase().includes(lowerQ) || 
      a.description?.toLowerCase().includes(lowerQ)
    );
  }, [alerts, searchQuery]);

  const displayAlerts = useMemo(() => {
    let list = filteredAlerts;
    if (activeTab === 'saved') {
      return list.filter(a => bookmarks.has(a._id || a.title));
    }
    if (activeTab === 'trending') {
      list = list.filter(a => a.threat_level === 'high');
    }
    if (activeTab === 'latest') {
      return list.slice(0, 30);
    }
    return list;
  }, [filteredAlerts, activeTab, bookmarks]);

  const stateStats = useMemo(() => {
    const mockStats = getStateStatistics();
    // Merge live stats over mock stats where available
    const combined = { ...mockStats };
    Object.entries(liveStats).forEach(([state, count]) => {
      combined[state] = (combined[state] || 0) + count;
    });
    return combined;
  }, [liveStats]);

  const renderScamChart = () => {
    if (displayAlerts.length === 0) return null;
    
    // Group by year
    const yearCounts: Record<string, number> = {};
    displayAlerts.forEach(a => {
      const yr = new Date(a.publishedAt).getFullYear() || new Date().getFullYear();
      yearCounts[yr] = (yearCounts[yr] || 0) + 1;
    });
    
    const sortedYears = Object.keys(yearCounts).sort();
    if (sortedYears.length < 2) return null; // need at least 2 years for a meaningful chart
    
    const maxCount = Math.max(...Object.values(yearCounts));
    const CHART_HEIGHT = 100;

    return (
      <CyberCard glass glowColor={theme.cyan} style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>Scam Frequency Trends</Text>
        <View style={styles.chartBarsWrapper}>
          {sortedYears.slice(-10).map(yr => {
            const height = maxCount > 0 ? (yearCounts[yr] / maxCount) * CHART_HEIGHT : 0;
            return (
              <View key={yr} style={styles.barColumn}>
                <View style={[styles.bar, { 
                  height: Math.max(height, 5), 
                  backgroundColor: theme.cyan,
                  shadowColor: theme.cyan,
                  shadowOpacity: 0.5,
                  shadowRadius: 10,
                  elevation: 5
                }]} />
                <Text style={[styles.barLabel, { color: theme.textDim }]}>{yr.slice(-2)}</Text>
              </View>
            );
          })}
        </View>
      </CyberCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Live Threat Ticker */}
      <View style={[styles.tickerWrapper, { backgroundColor: theme.red + '15', borderBottomColor: theme.red + '30' }]}>
        <View style={styles.tickerLead}>
          <MaterialCommunityIcons name="broadcast" size={14} color={theme.red} />
          <Text style={[styles.tickerLeadText, { color: theme.red }]}>LIVE_FEED</Text>
        </View>
        <RNAnimated.View style={[styles.tickerScroll, { transform: [{ translateX: tickerAnim }] }]}>
          <Text style={[styles.tickerText, { color: theme.textSecondary }]}>
            {MOCK_TICKER[tickerIndex]}  •  {MOCK_TICKER[(tickerIndex + 1) % MOCK_TICKER.length]}
          </Text>
        </RNAnimated.View>
      </View>

      {/* Search Header */}
      <Animated.View 
        entering={FadeInUp.duration(600)}
        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingHorizontal: 20, zIndex: 10 }}
      >
        <BlurView intensity={profile.isDarkMode ? 30 : 60} style={styles.glassSearchWrapper}>
          <View style={[styles.searchContainer, { backgroundColor: 'transparent', borderColor: theme.border + '40' }]}>
            <Ionicons name="search" size={18} color={theme.cyan} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search keywords (e.g. UPI, Job)"
              placeholderTextColor={theme.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.textDim} />
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
        
        <TouchableOpacity 
          style={styles.notificationBtn} 
          onPress={() => setSubscribed(!subscribed)}
        >
          <BlurView intensity={30} style={styles.notifGlass}>
            <Ionicons 
              name={subscribed ? "notifications" : "notifications-outline"} 
              size={22} 
              color={subscribed ? theme.cyan : theme.textDim} 
            />
            {subscribed && <View style={[styles.notificationDot, { backgroundColor: theme.red }]} />}
          </BlurView>
        </TouchableOpacity>
      </Animated.View>

      {/* Filters */}
      <View style={styles.filtersWrapper}>
         {renderFilterChips(YEARS, selectedYear, setSelectedYear)}
         {renderFilterChips(CATEGORIES, selectedCategory, setSelectedCategory)}
         {renderFilterChips(STATES, selectedState, setSelectedState)}
      </View>

      {/* List */}
      <FlatList
        data={displayAlerts}
        keyExtractor={(item, index) => item._id || index.toString()}
        contentContainerStyle={styles.listContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={() => (
          <>
            <View style={{ alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: theme.border + '20' }}>
               <Logo size={36} isDarkMode={profile.isDarkMode} />
            </View>
            <View style={[styles.tabsContainer, { backgroundColor: theme.surface + '40', borderColor: theme.border + '20' }]}>
              <Animated.View style={[styles.tabIndicator, indicatorStyle, { backgroundColor: theme.cyan + '30', borderColor: theme.cyan }]} />
              {TABS.map(tab => (
                <TouchableOpacity 
                  key={tab} 
                  style={styles.tabBtn}
                  onPress={() => {
                    setActiveTab(tab);
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.tabText, { color: activeTab === tab ? theme.cyan : theme.textDim }]}>
                    {tab.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {activeTab === 'historical' && (
              <View style={styles.viewModeToggle}>
                <TouchableOpacity 
                  style={[styles.togglePill, viewMode === 'map' && { backgroundColor: theme.cyan + '20', borderColor: theme.cyan }]}
                  onPress={() => setViewMode('map')}
                >
                  <MaterialCommunityIcons name="map-marker-radius" size={16} color={viewMode === 'map' ? theme.cyan : theme.textDim} />
                  <Text style={[styles.togglePillText, { color: viewMode === 'map' ? theme.cyan : theme.textDim }]}>INDIA MAP</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.togglePill, viewMode === 'list' && { backgroundColor: theme.purple + '20', borderColor: theme.purple }]}
                  onPress={() => setViewMode('list')}
                >
                  <MaterialCommunityIcons name="format-list-bulleted" size={16} color={viewMode === 'list' ? theme.purple : theme.textDim} />
                  <Text style={[styles.togglePillText, { color: viewMode === 'list' ? theme.purple : theme.textDim }]}>LIST VIEW</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'historical' && viewMode === 'map' && (
              <IndiaMap 
                stats={liveStats} 
                selectedState={selectedState} 
                onSelectState={(st) => {
                  setSelectedState(st);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                theme={theme}
              />
            )}
            
            {activeTab !== 'historical' && renderScamChart()}
            {activeTab === 'historical' && viewMode === 'list' && renderScamChart()}

            <View style={styles.listHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.listTitle, { color: theme.text }]}>
                  {activeTab === 'latest' ? 'Recent Alerts' : activeTab === 'trending' ? 'High Threat Scams' : 'Archival Data'}
                </Text>
                <TouchableOpacity onPress={() => setShowGuide(true)}>
                  <MaterialCommunityIcons name="information" size={18} color={theme.cyan} />
                </TouchableOpacity>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.resultsCount, { color: theme.cyan }]}>
                  {displayAlerts.length} results
                </Text>
                <Text style={{ fontSize: 9, color: theme.textDim, marginTop: 4, fontStyle: 'italic' }}>
                  Swipe cards left 👈
                </Text>
              </View>
            </View>
          </>
        )}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 100).duration(500)}>
            <Swipeable
              renderRightActions={() => (
                <View style={styles.swipeActionsContainer}>
                  <TouchableOpacity 
                    style={[styles.swipeActionBtn, { backgroundColor: bookmarks.has(item._id || item.title) ? theme.red : theme.cyan }]} 
                    onPress={() => toggleBookmark(item._id || item.title)}
                  >
                    <Ionicons name={bookmarks.has(item._id || item.title) ? "bookmark" : "bookmark-outline"} size={24} color="#000" />
                    <Text style={styles.swipeActionText}>{bookmarks.has(item._id || item.title) ? "Unsave" : "Save"}</Text>
                  </TouchableOpacity>
                </View>
              )}
            >
              <CyberCard 
                glass 
                glowColor={threatColor(item.threat_level)} 
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.threatBadge, { backgroundColor: threatColor(item.threat_level) + '20', borderColor: threatColor(item.threat_level) }]}>
                    <Text style={[styles.threatText, { color: threatColor(item.threat_level) }]}>
                      {item.threat_level?.toUpperCase() || 'MEDIUM'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={[styles.dateText, { color: theme.textDim }]}>
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity onPress={() => toggleBookmark(item._id || item.title)}>
                      <Ionicons name={bookmarks.has(item._id || item.title) ? "bookmark" : "bookmark-outline"} size={20} color={theme.cyan} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={3}>
                  {item.description}
                </Text>
                <View style={styles.cardFooter}>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={theme.cyan} />
                    <Text style={[styles.locationText, { color: theme.textDim }]}>{item.state}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.readBtn, { backgroundColor: theme.cyan }]}
                    onPress={() => openArticle(item)}
                  >
                    <Text style={styles.readBtnText}>{t('readFullArticle') || "Read Full Article"}</Text>
                  </TouchableOpacity>
                </View>
              </CyberCard>
            </Swipeable>
          </Animated.View>
        )}
        ListFooterComponent={() => loading ? (
          <ActivityIndicator size="large" color={theme.cyan} style={{ margin: 20 }} />
        ) : null}
        ListEmptyComponent={() => !loading ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="text-box-search-outline" size={60} color={theme.textDim} />
            <Text style={[styles.emptyText, { color: theme.textDim }]}>{t('noAlertsFound') || "No alerts found matching your criteria."}</Text>
          </View>
        ) : null}
      />

      {/* How to Use Modal */}
      <Modal visible={showGuide} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 15 }}>
              <MaterialCommunityIcons name="information" size={24} color={theme.cyan} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>Dashboard Guide</Text>
            </View>
            <Text style={[styles.modalText, { color: '#888' }]}>
              1. <Text style={{ color: theme.text, fontFamily: "Inter_700Bold" }}>Search</Text>: Use the top bar to find specific scams by keyword (e.g. UPI, Job).{'\n\n'}
              2. <Text style={{ color: theme.text, fontFamily: "Inter_700Bold" }}>Filters</Text>: Use the chips to filter results by <Text style={{ color: theme.cyan }}>Year</Text>, <Text style={{ color: theme.cyan }}>Category</Text>, and <Text style={{ color: theme.cyan }}>State</Text>.{'\n\n'}
              3. <Text style={{ color: theme.text, fontFamily: "Inter_700Bold" }}>Severity</Text>: Scams are tagged natively: High (Red), Medium (Yellow), Low (Green).{'\n\n'}
              4. <Text style={{ color: theme.text, fontFamily: "Inter_700Bold" }}>Full Articles</Text>: Click &quot;Read Full Article&quot; to visit the original source or perform a Google search.
            </Text>
            <TouchableOpacity 
              style={[styles.gotItBtn, { backgroundColor: theme.cyan }]}
              onPress={() => setShowGuide(false)}
            >
              <Text style={styles.gotItText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Mock Toast Notification */}
      {showToast && (
        <RNAnimated.View style={[styles.toast, { backgroundColor: theme.surfaceElevated, borderLeftColor: theme.red }]}>
          <Ionicons name="warning" size={20} color={theme.red} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.toastTitle, { color: theme.red }]}>NEW ALERT DETECTED</Text>
            <Text style={[styles.toastText, { color: theme.text }]} numberOfLines={1}>Financial Fraud spikes in your region</Text>
          </View>
        </RNAnimated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tickerWrapper: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  tickerLead: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  tickerLeadText: {
    fontSize: 9,
    fontFamily: 'Inter_900Black',
    letterSpacing: 1,
  },
  tickerScroll: {
    flexDirection: 'row',
    width: width * 2,
    paddingLeft: 20,
  },
  tickerText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  glassSearchWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notificationBtn: {
    marginLeft: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  notifGlass: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    width: (width - 48) / 4, // adjustment for padding/border
    borderRadius: 8,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  tabText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  chartContainer: {
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  chartTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 15,
  },
  chartBarsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingBottom: 20,
  },
  barColumn: {
    alignItems: 'center',
    width: 20,
  },
  bar: {
    width: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  filtersWrapper: {
    marginTop: 10,
    marginBottom: 5,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  chipText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 15,
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 10,
  },
  listTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  resultsCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  threatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  threatText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  dateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginBottom: 8,
    lineHeight: 20,
  },
  cardDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#33333330', // generic divider mostly invisible
    paddingTop: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  readBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  readBtnText: {
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 15,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
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
  },
  gotItBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
  },
  gotItText: {
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  toast: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toastTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  toastText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingLeft: 10,
    marginBottom: 16,
  },
  swipeActionBtn: {
    width: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  swipeActionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#000',
    marginTop: 2,
  },
  viewModeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginVertical: 15,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  togglePillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  mapGrid: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  mapGridTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 15,
  },
  stateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  stateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  stateChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  clearMapBtn: {
    alignSelf: 'center',
    marginTop: 15,
    padding: 5,
  }
});
