import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  SHADOWS,
  AMENITY_LABELS,
  SAFETY_FEATURE_LABELS,
  PROPERTY_TYPE_LABELS,
} from "../../constants";
import { PG } from "../../types";
import { searchPGs } from "../../services/firestore";

interface PGCardProps {
  pg: PG;
  onPress: () => void;
}

function PGCard({ pg, onPress }: PGCardProps) {
  const firstPhoto = pg.photos[0];
  const safetyScore = calculateSafetyScore(pg);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        {firstPhoto ? (
          <Image
            source={{ uri: firstPhoto }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>🏠</Text>
          </View>
        )}
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.badge,
              pg.verification.status === "verified" && styles.badgeVerified,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                pg.verification.status === "verified" &&
                  styles.badgeTextVerified,
              ]}
            >
              {pg.verification.status === "verified" ? "✓ Verified" : "Pending"}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Safety: {safetyScore}/100</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {pg.title}
          </Text>
          <Text style={styles.propertyType}>
            {PROPERTY_TYPE_LABELS[pg.propertyType]}
          </Text>
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.locationText}>
            📍 {pg.address.city}, {pg.address.state}
          </Text>
        </View>

        <View style={styles.featuresRow}>
          {pg.amenities.slice(0, 3).map((amenity, i) => (
            <View key={i} style={styles.featureChip}>
              <Text style={styles.featureText}>
                {AMENITY_LABELS[amenity] || amenity}
              </Text>
            </View>
          ))}
          {pg.amenities.length > 3 && (
            <View style={styles.featureChip}>
              <Text style={styles.featureText}>
                +{pg.amenities.length - 3} more
              </Text>
            </View>
          )}
        </View>

        <View style={styles.safetyRow}>
          {pg.safetyFeatures.slice(0, 2).map((feature, i) => (
            <View key={i} style={styles.safetyChip}>
              <Text style={styles.safetyChipText}>
                🛡️ {SAFETY_FEATURE_LABELS[feature]}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>
              ₹{pg.pricing.rent.toLocaleString()}
            </Text>
            <Text style={styles.priceSub}>
              /month • {pg.pricing.sharing} sharing
            </Text>
          </View>
          <View style={styles.stats}>
            <Text style={styles.stat}>❤️ {pg.stats.views}</Text>
            <Text style={styles.stat}>💬 {pg.stats.enquiries}</Text>
            <Text style={styles.stat}>⭐ {pg.stats.avgRating.toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function calculateSafetyScore(pg: PG): number {
  const { SAFETY_SCORE_FACTORS } = require("../../constants");
  let score = 0;

  pg.safetyFeatures.forEach((feature) => {
    score += SAFETY_SCORE_FACTORS[feature] || 0;
  });

  if (pg.verification.status === "verified")
    score += SAFETY_SCORE_FACTORS.verifiedOwner;
  if (pg.stats.avgRating >= 4) score += SAFETY_SCORE_FACTORS.goodReviews;

  return Math.min(score, 100);
}

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [pgs, setPgs] = React.useState<PG[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastDoc, setLastDoc] = React.useState<any>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [filters, setFilters] = React.useState({
    city: "",
    minRent: "",
    maxRent: "",
    sharing: "",
    propertyType: "",
  });

  const loadPGs = async (reset = false) => {
    if (reset) {
      setPGs([]);
      setLastDoc(null);
      setHasMore(true);
    }

    if (!hasMore && !reset) return;

    setLoading(true);
    try {
      const searchFilters: any = {};
      if (filters.city) searchFilters.city = filters.city;
      if (filters.minRent) searchFilters.minRent = parseInt(filters.minRent);
      if (filters.maxRent) searchFilters.maxRent = parseInt(filters.maxRent);
      if (filters.sharing) searchFilters.sharing = parseInt(filters.sharing);
      if (filters.propertyType)
        searchFilters.propertyType = filters.propertyType;
      searchFilters.verifiedOnly = true;

      const result = await searchPGs(
        searchFilters,
        20,
        reset ? undefined : lastDoc,
      );
      setPGs((prev) => (reset ? result.pgs : [...prev, ...result.pgs]));
      setLastDoc(result.lastDoc);
      setHasMore(!!result.lastDoc);
    } catch (error) {
      console.error("Error loading PGs:", error);
      Alert.alert("Error", "Failed to load PGs. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadPGs(true);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPGs(true);
  };

  const onEndReached = () => {
    if (!loading && hasMore) {
      loadPGs(false);
    }
  };

  const renderItem = ({ item }: { item: PG }) => (
    <PGCard
      pg={item}
      onPress={() => navigation.navigate("ListingDetail", { pgId: item.id })}
    />
  );

  const welcomeName = user?.name?.split(" ")[0] || "there";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>Hi, {welcomeName}! 👋</Text>
            <Text style={styles.greetingSub}>Find your perfect PG today</Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => navigation.navigate("Search")}
          >
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Filters */}
        <View style={styles.quickFilters}>
          <Text style={styles.sectionTitle}>Quick Filters</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {[
              {
                key: "verified",
                label: "✓ Verified Only",
                active: filters.city === "",
              },
              { key: "girls-only", label: "👩 Girls Only", active: false },
              { key: "under-10k", label: "💰 Under ₹10k", active: false },
              { key: "ac", label: "❄️ AC Rooms", active: false },
              { key: "food", label: "🍽️ Food Included", active: false },
              { key: "safety", label: "🛡️ High Safety", active: false },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[styles.chip, filter.active && styles.chipActive]}
                onPress={() => {
                  // Apply quick filter
                  if (filter.key === "verified") {
                    loadPGs(true);
                  }
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    filter.active && styles.chipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* PG List */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Available PGs</Text>
          <Text style={styles.listCount}>{pgs.length} properties found</Text>
        </View>

        {loading && pgs.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Finding your perfect PG...</Text>
          </View>
        ) : pgs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>No PGs found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filters or search in a different area
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate("Search")}
            >
              <Text style={styles.primaryButtonText}>Search PGs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={pgs}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              hasMore ? (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadMoreText}>Loading more...</Text>
                </View>
              ) : (
                <View style={styles.endContainer}>
                  <Text style={styles.endText}>
                    You've seen all available PGs
                  </Text>
                </View>
              )
            }
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
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
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  greetingSub: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  filterButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  filterButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  quickFilters: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  chipsContainer: {
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  chip: {
    backgroundColor: COLORS.surface,
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
    fontWeight: "600",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  listCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  separator: {
    height: SPACING.md,
  },
  loadMoreContainer: {
    padding: SPACING.md,
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
  },
  loadMoreText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  endContainer: {
    padding: SPACING.xl,
    alignItems: "center",
  },
  endText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  // PG Card styles
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  imageContainer: {
    position: "relative",
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.divider,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 48,
  },
  badgeContainer: {
    position: "absolute",
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badge: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  badgeVerified: {
    backgroundColor: COLORS.secondary,
  },
  badgeText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
  },
  badgeTextVerified: {
    color: COLORS.surface,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  propertyType: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: "500",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  locationRow: {
    marginBottom: SPACING.sm,
  },
  locationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  featuresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  featureChip: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  featureText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  safetyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  safetyChip: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  safetyChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.secondaryDark,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  price: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.primary,
  },
  priceSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  stats: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  stat: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});
