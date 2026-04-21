import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, G, Rect, Text as SvgText, Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface StateNode {
  id: string;
  name: string;
  x: number;
  y: number;
  shortName: string;
}

const STATE_NODES: StateNode[] = [
  { id: '1', name: 'Delhi', shortName: 'DL', x: 4, y: 2 },
  { id: '2', name: 'Maharashtra', shortName: 'MH', x: 2, y: 6 },
  { id: '3', name: 'Karnataka', shortName: 'KA', x: 3, y: 8 },
  { id: '4', name: 'Tamil Nadu', shortName: 'TN', x: 4, y: 10 },
  { id: '5', name: 'Uttar Pradesh', shortName: 'UP', x: 5, y: 3 },
  { id: '6', name: 'Gujarat', shortName: 'GJ', x: 1, y: 5 },
  { id: '7', name: 'West Bengal', shortName: 'WB', x: 8, y: 5 },
  { id: '8', name: 'Rajasthan', shortName: 'RJ', x: 2, y: 3 },
  { id: '9', name: 'Andhra Pradesh', shortName: 'AP', x: 5, y: 8 },
  { id: '10', name: 'Telangana', shortName: 'TS', x: 4, y: 7 },
  { id: '11', name: 'Kerala', shortName: 'KL', x: 3, y: 10 },
  { id: '12', name: 'Madhya Pradesh', shortName: 'MP', x: 4, y: 5 },
  { id: '13', name: 'Bihar', shortName: 'BR', x: 7, y: 3 },
  { id: '14', name: 'Punjab', shortName: 'PB', x: 3, y: 1 },
  { id: '15', name: 'Haryana', shortName: 'HR', x: 4, y: 1 },
  { id: '16', name: 'Odisha', shortName: 'OD', x: 7, y: 6 },
  { id: '17', name: 'Assam', shortName: 'AS', x: 10, y: 3 },
  { id: '18', name: 'Jharkhand', shortName: 'JH', x: 7, y: 4 },
  { id: '19', name: 'Chhattisgarh', shortName: 'CT', x: 6, y: 6 },
  { id: '20', name: 'Uttarakhand', shortName: 'UK', x: 5, y: 2 },
  { id: '21', name: 'Himachal Pradesh', shortName: 'HP', x: 4, y: 0 },
  { id: '22', name: 'Goa', shortName: 'GA', x: 2, y: 8 },
  { id: '23', name: 'Arunachal Pradesh', shortName: 'AR', x: 11, y: 2 },
  { id: '24', name: 'Manipur', shortName: 'MN', x: 11, y: 4 },
  { id: '25', name: 'Meghalaya', shortName: 'ML', x: 10, y: 4 },
  { id: '26', name: 'Mizoram', shortName: 'MZ', x: 11, y: 5 },
  { id: '27', name: 'Nagaland', shortName: 'NL', x: 11, y: 3 },
  { id: '28', name: 'Sikkim', shortName: 'SK', x: 8, y: 3 },
  { id: '29', name: 'Tripura', shortName: 'TR', x: 10, y: 5 },
];

interface IndiaMapProps {
  stats: Record<string, number>;
  selectedState: string;
  onSelectState: (stateName: string) => void;
  theme: any;
}

export default function IndiaMap({ stats, selectedState, onSelectState, theme }: IndiaMapProps) {
  const CELL_SIZE = (width - 40) / 11;
  const GAP = 2;

  const maxScams = useMemo(() => Math.max(...Object.values(stats), 1), [stats]);

  const getIntensityColor = (count: number) => {
    if (count === 0) return theme.surface;
    const ratio = count / maxScams;
    if (ratio > 0.8) return theme.red;
    if (ratio > 0.4) return theme.yellow;
    return theme.cyan;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsHeader}>
        <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.red + '40' }]}>
          <MaterialCommunityIcons name="fire" size={20} color={theme.red} />
          <View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>HOTSPOT</Text>
            <Text style={[styles.statValue, { color: theme.red }]} numberOfLines={1}>
              {Object.entries(stats).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A'}
            </Text>
          </View>
        </View>
        <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.green + '40' }]}>
          <MaterialCommunityIcons name="shield-check" size={20} color={theme.green} />
          <View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>SAFE ZONE</Text>
            <Text style={[styles.statValue, { color: theme.green }]} numberOfLines={1}>
              {Object.entries(stats).sort((a,b) => a[1]-b[1])[0]?.[0] || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.mapGrid}>
        {STATE_NODES.map((node) => {
          const count = stats[node.name] || 0;
          const color = getIntensityColor(count);
          const isSelected = selectedState === node.name;
          
          return (
            <TouchableOpacity
              key={node.id}
              style={[
                styles.gridItem,
                {
                  left: node.x * (CELL_SIZE + GAP),
                  top: node.y * (CELL_SIZE + GAP),
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: isSelected ? color : color + '20',
                  borderColor: isSelected ? theme.text : color,
                  borderWidth: isSelected ? 2 : 1,
                  shadowColor: color,
                  shadowOpacity: isSelected ? 0.8 : 0.3,
                  shadowRadius: 5,
                }
              ]}
              onPress={() => onSelectState(node.name)}
            >
              <Text style={[styles.nodeText, { color: isSelected ? '#000' : theme.text, fontSize: CELL_SIZE * 0.4 }]}>
                {node.shortName}
              </Text>
              {count > 0 && !isSelected && (
                <View style={[styles.badge, { backgroundColor: color }]}>
                   <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.cyan }]} />
          <Text style={[styles.legendText, { color: theme.textDim }]}>Low Risk</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.yellow }]} />
          <Text style={[styles.legendText, { color: theme.textDim }]}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.red }]} />
          <Text style={[styles.legendText, { color: theme.textDim }]}>High Alert</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 25,
    gap: 10,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Inter_800ExtraBold',
  },
  mapGrid: {
    width: width - 40,
    height: width * 1.1,
    position: 'relative',
  },
  gridItem: {
    position: 'absolute',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeText: {
    fontFamily: 'Inter_900Black',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#000',
    fontSize: 8,
    fontFamily: 'Inter_800ExtraBold',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  }
});
