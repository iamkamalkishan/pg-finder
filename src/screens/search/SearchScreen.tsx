import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Picker } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, INDIAN_STATES, MAJOR_CITIES, PROPERTY_TYPES, SHARING_OPTIONS, AMENITIES, SAFETY_FEATURES, AMENITY_LABELS, SAFETY_FEATURE_LABELS, PROPERTY_TYPE_LABELS } from '../../constants';
import { PG, PropertyType } from '../../types';
import { searchPGs } from '../../services/firestore';

export function SearchScreen({ navigation }: any) {
  const [filters, setFilters] = React.useState({
    city: '',
    state: '',
    propertyType: '',
    minRent: '',
    maxRent: '',
    sharing: '',
    amenities: [] as string[],
    safetyFeatures: [] as string[],
    verifiedOnly: true,
  });
  const [results, setResults] = React.useState<PG[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [lastDoc, setLastDoc] = React.useState<any>(null);
  const [hasMore, setHasMore] = React.useState(true);

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (arrayKey: string, item: string) => {
    setFilters(prev => {
      const arr = prev[arrayKey as keyof typeof filters] as string[];
      const newArr = arr.includes(item) 
        ? arr.filter(i => i !== item)
        : [...arr, item];
      return { ...prev, [arrayKey]: newArr };
    });
  };

  const handleSearch = async () => {
    setLoading(true);
    setResults([]);
    setLastDoc(null);
    setHasMore(true);
    
    try {
      const searchFilters: any = { verifiedOnly: filters.verifiedOnly };
      if (filters.city) searchFilters.city = filters.city;
      if (filters.state) searchFilters.state = filters.state;
      if (filters.propertyType) searchFilters.propertyType = filters.propertyType as PropertyType;
      if (filters.minRent) searchFilters.minRent = parseInt(filters.minRent);
      if (filters.maxRent) searchFilters.maxRent = parseInt(filters.maxRent);
      if (filters.sharing) searchFilters.sharing = parseInt(filters.sharing);
      if (filters.amenities.length) searchFilters.amenities = filters.amenities;
      if (filters.safetyFeatures.length) searchFilters.safetyFeatures = filters.safetyFeatures;
      
      const result = await searchPGs(searchFilters, 20);
      setResults(result.pgs);
      setLastDoc(result.lastDoc);
      setHasMore(!!result.lastDoc);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      state: '',
      propertyType: '',
      minRent: '',
      maxRent: '',
      sharing: '',
      amenities: [],
      safetyFeatures: [],
      verifiedOnly: true,
    });
    setResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Search PGs</Text>
          <Text style={styles.subtitle}>Find your perfect stay with smart filters</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <TextInput
            style={styles.input}
            placeholder="City (e.g., Bangalore, Mumbai)"
            value={filters.city}
            onChangeText={v => updateFilter('city', v)}
            autoCapitalize="words"
          />
          
          <Picker
            selectedValue={filters.state}
            onValueChange={v => updateFilter('state', v)}
            style={styles.picker}
            mode="dialog"
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Select State" value="" />
            {INDIAN_STATES.map(state => (
              <Picker.Item key={state} label={state} value={state} />
            ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Property Type</Text>
          <Picker
            selectedValue={filters.propertyType}
            onValueChange={v => updateFilter('propertyType', v)}
            style={styles.picker}
            mode="dialog"
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Any Type" value="" />
            {PROPERTY_TYPES.map(type => (
              <Picker.Item key={type.value} label={type.label} value={type.value} />
            ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Budget & Sharing</Text>
          
          <View style={styles.twoInputs}>
            <TextInput
              style={styles.input}
              placeholder="Min Rent (₹)"
              value={filters.minRent}
              onChangeText={v => updateFilter('minRent', v)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Max Rent (₹)"
              value={filters.maxRent}
              onChangeText={v => updateFilter('maxRent', v)}
              keyboardType="numeric"
            />
          </View>
          
          <Picker
            selectedValue={filters.sharing}
            onValueChange={v => updateFilter('sharing', v)}
            style={styles.picker}
            mode="dialog"
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Any Sharing" value="" />
            {SHARING_OPTIONS.map(s => (
              <Picker.Item key={s} label={`${s} Sharing`} value={s.toString()} />
            ))}
          </Picker>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.chipGrid}>
            {AMENITIES.map(amenity => (
              <TouchableOpacity
                key={amenity}
                style={[
                  styles.chip,
                  filters.amenities.includes(amenity) && styles.chipActive,
                ]}
                onPress={() => toggleArrayFilter('amenities', amenity)}
              >
                <Text style={[
                  styles.chipText,
                  filters.amenities.includes(amenity) && styles.chipTextActive,
                ]}>
                  {AMENITY_LABELS[amenity]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Safety Features</Text>
          <View style={styles.chipGrid}>
            {SAFETY_FEATURES.map(feature => (
              <TouchableOpacity
                key={feature}
                style={[
                  styles.chip,
                  filters.safetyFeatures.includes(feature) && styles.chipActive,
                ]}
                onPress={() => toggleArrayFilter('safetyFeatures', feature)}
              >
                <Text style={[
                  styles.chipText,
                  filters.safetyFeatures.includes(feature) && styles.chipTextActive,
                ]}>
                  {SAFETY_FEATURE_LABELS[feature]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.toggleRow} onPress={() => updateFilter('verifiedOnly', !filters.verifiedOnly)}>
            <View style={[
              styles.toggleTrack,
              filters.verifiedOnly && styles.toggleTrackOn,
            ]}>
              <View style={[
                styles.toggleThumb,
                filters.verifiedOnly && styles.toggleThumbOn,
              ]} />
            </View>
            <Text style={styles.toggleLabel}>
              ✓ Verified Properties Only
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={clearFilters}>
            <Text style={styles.secondaryButtonText}>Clear Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSearch} disabled={loading}>
            <Text style={styles.primaryButtonText}>
              {loading ? 'Searching...' : 'Search'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {loading && results.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>Results ({results.length})</Text>
          </View>
        )}

        {results.length > 0 && results.map((pg, index) => (
          <TouchableOpacity
            key={pg.id}
            style={styles.resultCard}
            onPress={() => navigation.navigate('ListingDetail', { pgId: pg.id })}
          >
            <View style={styles.resultImageContainer}>
              {pg.photos[0] ? (
                <Image source={{ uri: pg.photos[0] }} style={styles.resultImage} />
              ) : (
                <View style={styles.resultImagePlaceholder}>
                  <Text style={styles.placeholderText}>🏠</Text>
                </View>
              )}
              {pg.verification.status === 'verified' && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                </View>
              )}
            </View>
            <View style={styles.resultContent}>
              <Text style={styles.resultTitle}>{pg.title}</Text>
              <Text style={styles.resultLocation}>📍 {pg.address.city}, {pg.address.state}</Text>
              <View style={styles.resultMeta}>
                <Text style={styles.resultPrice}>₹{pg.pricing.rent.toLocaleString()}/mo</Text>
                <Text style={styles.resultSharing}>{pg.pricing.sharing} sharing</Text>
                <Text style={styles.resultType}>{PROPERTY_TYPE_LABELS[pg.propertyType]}</Text>
              </View>
              <View style={styles.resultSafety}>
                {pg.safetyFeatures.slice(0, 2).map((f, i) => (
                  <Text key={i} style={styles.safetyTag}>🛡️ {SAFETY_FEATURE_LABELS[f]}</Text>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {results.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.md,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  picker: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  pickerItem: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  twoInputs: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTrack: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  toggleThumbOn: {
    marginLeft: 24,
  },
  toggleLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  resultsHeader: {
    marginBottom: SPACING.md,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  resultImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  resultImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  verifiedBadgeText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  resultContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  resultLocation: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  resultMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  resultPrice: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  resultSharing: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  resultType: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  resultSafety: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  safetyTag: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.secondaryDark,
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});