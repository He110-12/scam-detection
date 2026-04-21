import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfile } from '@/context/ProfileContext';
import Colors from '@/constants/colors';
import CyberCard from '@/components/cyber/CyberCard';

export default function InstructionsScreen() {
  const router = useRouter();
  const { profile, t } = useProfile();
  const theme = profile.isDarkMode ? Colors.dark : Colors.light;

  const INSTRUCTIONS = [
    {
      title: 'Protection Shield',
      icon: 'shield-check',
      color: theme.green,
      content: 'The Protection Shield runs constantly in the background. Once activated, our AI scans incoming notifications (Gmail, Outlook) for suspicious patterns. If a threat is detected, you will immediately receive a high-risk security alert.'
    },
    {
      title: 'Manual Scanner',
      icon: 'text-box-search-outline',
      color: theme.purple,
      content: 'Received a strange email or SMS? Paste the raw text into the Manual Scanner. Our system checks urgency keywords, spoofed domains, and known malicious patterns to provide an instant risk score.'
    },
    {
      title: 'Scam Alerts Map',
      icon: 'map-marker-alert-outline',
      color: theme.red,
      content: 'Stay informed about local threats. Tap on your Indian state to view a real-time (and historical) database of scam alerts operating in your area. Use "Read Full Article" to learn prevention tactics directly from verified news portals.'
    },
    {
      title: 'Cyber Runner Gamification',
      icon: 'gamepad-variant-outline',
      color: theme.yellow,
      content: 'Train your scam-spotting reflexes. Play through 10 progressive levels where you must quickly identify whether an incoming message is safe or a scam. Earn badges based on your performance!'
    },
    {
      title: 'App Sharing & Distribution',
      icon: 'share-variant',
      color: theme.blue,
      content: 'Protect your community. Use the "SHIELD_ACCESS" section in your Profile to generate shareable links or QR codes. Others can scan your QR to visit the Download Portal and acquire the official Cyber Shield APK instantly.'
    }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
         </TouchableOpacity>
         <Text style={[styles.title, { color: theme.text }]}>App Instructions</Text>
         <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.headerBlock}>
          <MaterialCommunityIcons name="book-open-page-variant" size={48} color={theme.cyan} />
          <Text style={[styles.subtitle, { color: theme.text }]}>How to Use Scam Shield</Text>
          <Text style={[styles.desc, { color: theme.textSecondary }]}>
            Master your cyber defense tools. Follow these guidelines to maximize your protection against phishing, social engineering, and financial fraud.
          </Text>
        </View>

        {INSTRUCTIONS.map((item, index) => (
          <CyberCard key={index} glowColor={theme.border} style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
            </View>
            <Text style={[styles.cardContent, { color: theme.textSecondary }]}>
              {item.content}
            </Text>
          </CyberCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  content: { padding: 20, paddingBottom: 40 },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  subtitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    marginBottom: 20,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    flex: 1,
  },
  cardContent: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
  }
});
