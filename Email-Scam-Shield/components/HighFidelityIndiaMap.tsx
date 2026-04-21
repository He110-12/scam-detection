import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolateColor,
  useAnimatedProps
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width } = Dimensions.get('window');

// High-Fidelity Simplified SVG Paths for India States
// Coordinates are mapped to a 0 0 1000 1200 ViewBox
const INDIA_PATHS = [
  { id: 'AN', name: 'Andaman and Nicobar Islands', d: 'M900,1050l5,5l-5,5l-5-5Z M910,1000l5,5l-5,5l-5-5Z' },
  { id: 'AP', name: 'Andhra Pradesh', d: 'M480,850l20,-10l30,10l40,40l-20,50l-50,20l-40,-30l-10,-40l30,-40z' },
  { id: 'AR', name: 'Arunachal Pradesh', d: 'M850,250l50,20l30,-20l20,30l-40,40l-60,-20l0,-50z' },
  { id: 'AS', name: 'Assam', d: 'M800,350l40,0l40,40l-20,40l-60,-20l-20,-40l20,-20z' },
  { id: 'BR', name: 'Bihar', d: 'M620,350l80,10l20,40l-60,30l-50,-20l10,-60z' },
  { id: 'CH', name: 'Chandigarh', d: 'M400,180l10,0l0,10l-10,0z' },
  { id: 'CT', name: 'Chhattisgarh', d: 'M520,550l30,10l20,60l-30,40l-40,-30l0,-60l20,-20z' },
  { id: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu', d: 'M250,580l10,0l0,10l-10,0z' },
  { id: 'DL', name: 'Delhi', d: 'M410,290l20,5l5,15l-15,10l-15,-10l5,-20z' },
  { id: 'GA', name: 'Goa', d: 'M280,800l15,5l-5,15l-15,-5l5,-15z' },
  { id: 'GJ', name: 'Gujarat', d: 'M150,450l60,10l40,60l-20,70l-80,10l-20,-50l20,-100z' },
  { id: 'HR', name: 'Haryana', d: 'M400,220l40,20l10,50l-50,10l-20,-40l20,-40z' },
  { id: 'HP', name: 'Himachal Pradesh', d: 'M420,120l40,20l20,50l-40,20l-40,-40l20,-50z' },
  { id: 'JK', name: 'Jammu and Kashmir', d: 'M380,20l80,-10l40,60l-50,60l-70,-30l0,-80z' },
  { id: 'JH', name: 'Jharkhand', d: 'M620,450l50,10l30,50l-40,30l-50,-20l10,-70z' },
  { id: 'KA', name: 'Karnataka', d: 'M300,750l50,20l40,100l-40,60l-60,-20l-10,-100l20,-60z' },
  { id: 'KL', name: 'Kerala', d: 'M350,980l20,40l10,80l-30,20l-20,-80l20,-60z' },
  { id: 'LA', name: 'Ladakh', d: 'M460,10l120,40l-20,80l-80,-20l-20,-100z' },
  { id: 'LD', name: 'Lakshadweep', d: 'M200,950l10,0l0,10l-10,0z' },
  { id: 'MP', name: 'Madhya Pradesh', d: 'M350,450l120,20l50,80l-80,60l-120,-30l30,-130z' },
  { id: 'MH', name: 'Maharashtra', d: 'M250,550l100,20l80,80l-40,100l-120,-20l-40,-100l20,-80z' },
  { id: 'MN', name: 'Manipur', d: 'M900,450l20,10l0,30l-20,10l-10,-40l10,-10z' },
  { id: 'ML', name: 'Meghalaya', d: 'M810,420l40,0l10,20l-40,10l-10,-30z' },
  { id: 'MZ', name: 'Mizoram', d: 'M890,510l20,10l-10,40l-20,-10l10,-40z' },
  { id: 'NL', name: 'Nagaland', d: 'M900,380l20,10l-5,30l-20,-10l5,-30z' },
  { id: 'OR', name: 'Odisha', d: 'M580,550l80,40l20,80l-60,40l-70,-80l30,-80z' },
  { id: 'PY', name: 'Puducherry', d: 'M500,950l10,10l-10,10l-10,-10l10,-10z' },
  { id: 'PB', name: 'Punjab', d: 'M350,180l50,10l10,50l-50,20l-20,-50l10,-30z' },
  { id: 'RJ', name: 'Rajasthan', d: 'M220,250l120,20l60,100l-60,100l-120,-40l0,-180z' },
  { id: 'SK', name: 'Sikkim', d: 'M700,320l20,5l5,15l-15,10l-10,-30z' },
  { id: 'TN', name: 'Tamil Nadu', d: 'M420,930l60,40l20,120l-60,50l-40,-100l20,-110z' },
  { id: 'TG', name: 'Telangana', d: 'M450,650l60,20l20,60l-50,40l-60,-20l30,-100z' },
  { id: 'TR', name: 'Tripura', d: 'M850,510l20,10l-5,15l-15,-5l0,-20z' },
  { id: 'UP', name: 'Uttar Pradesh', d: 'M450,320l120,30l40,80l-100,50l-80,-60l20,-100z' },
  { id: 'UK', name: 'Uttarakhand', d: 'M480,220l50,30l0,50l-60,10l10,-90z' },
  { id: 'WB', name: 'West Bengal', d: 'M700,450l40,20l0,120l-60,20l-20,-100l40,-60z' },
];

interface IndiaMapProps {
  stats: Record<string, number>;
  selectedState: string;
  onSelectState: (stateName: string) => void;
  theme: any;
}

export default function HighFidelityIndiaMap({ stats, selectedState, onSelectState, theme }: IndiaMapProps) {
  const pulse = useSharedValue(0);
  const maxScams = React.useMemo(() => Math.max(...Object.values(stats), 1), [stats]);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const getIntensityColor = (count: number) => {
    if (count === 0) return theme.surface;
    const ratio = count / maxScams;
    if (ratio > 0.7) return theme.red;
    if (ratio > 0.3) return theme.yellow;
    return theme.cyan;
  };

  const mapWidth = width - 40;
  const mapHeight = mapWidth * 1.2;

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

      <View style={styles.mapWrapper}>
        <Svg 
          viewBox="0 0 1000 1250" 
          width={mapWidth} 
          height={mapHeight}
          style={styles.svg}
        >
          <G>
            {INDIA_PATHS.map((state) => {
              const count = stats[state.name] || 0;
              const color = getIntensityColor(count);
              const isSelected = selectedState === state.name;
              
              return (
                <StatePath 
                  key={state.id}
                  state={state}
                  color={color}
                  isSelected={isSelected}
                  pulse={pulse}
                  theme={theme}
                  onPress={() => onSelectState(state.name)}
                />
              );
            })}
          </G>
        </Svg>
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

function StatePath({ state, color, isSelected, pulse, theme, onPress }: any) {
  const animatedProps = useAnimatedProps(() => {
    if (!isSelected) {
      return {
        fill: color + '40' as any,
        stroke: color,
        strokeWidth: 1,
        strokeOpacity: 0.6,
      };
    }

    return {
      fill: interpolateColor(
        pulse.value,
        [0, 1],
        [color, color + 'CC']
      ) as any,
      stroke: theme.text,
      strokeWidth: 3,
      strokeOpacity: 1,
    };
  });

  return (
    <AnimatedPath
      d={state.d}
      onPress={onPress}
      animatedProps={animatedProps}
      strokeLinejoin="round"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
    width: '100%',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
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
  mapWrapper: {
    width: width - 40,
    height: (width - 40) * 1.25,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  svg: {
    // shadow effects aren't directly on SVG but we can apply to wrapper if needed
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
