import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '../../constants';
import { PG } from '../../types';
import { getPGsByOwner, getEnquiriesByOwner } from '../../services/firestore';

export function OwnerAnalyticsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [pgs, setPgs] = React.useState<PG[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [timeRange, setTimeRange] = React.useState<'7d' | '30d' | '90d'>('30d');

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getPGsByOwner(user.uid);
      setPgs(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Error', 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Calculate metrics
  const totalViews = pgs.reduce((sum, p) => sum + p.stats.views, 0);
  const totalEnquiries = pgs.reduce((sum, p) => sum + p.stats.enquiries, 0);
  const totalBookings = pgs.reduce((sum, p) => sum + p.stats.bookings, 0);
  const avgRating = pgs.length > 0 
    ? pgs.reduce((sum, p) => sum + p.stats.avgRating, 0) / pgs.length 
    : 0;
  const totalReviews = pgs.reduce((sum, p) => sum + p.stats.reviewCount, 0);
  const conversionRate = totalEnquiries > 0 ? ((totalBookings / totalEnquiries) * 100).toFixed(1) : 0;

  // Top performing PGs
  const topPGs = [...pgs].sort((a, b) => b.stats.views - a.stats.views).slice(0, 5);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Track your PG performance</Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {(['7d', '30d', '90d'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[
                styles.timeRangeButtonText,
                timeRange === range && styles.timeRangeButtonTextActive,
              ]}>
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>👁️</Text>
            <Text style={styles.metricValue}>{totalViews.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Total Views</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>💬</Text>
            <Text style={styles.metricValue}>{totalEnquiries}</Text>
            <Text style={styles.metricLabel}>Enquiries</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>✅</Text>
            <Text style={styles.metricValue}>{totalBookings}</Text>
            <Text style={styles.metricLabel}>Bookings</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>📈</Text>
            <Text style={styles.metricValue}>{conversionRate}%</Text>
            <Text style={styles.metricLabel}>Conversion</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>⭐</Text>
            <Text style={styles.metricValue}>{avgRating.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Avg Rating</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>📝</Text>
            <Text style={styles.metricValue}>{totalReviews}</Text>
            <Text style={styles.metricLabel}>Reviews</Text>
          </View>
        </View>

        {/* Revenue Estimation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimated Revenue</Text>
          <View style={styles.revenueCard}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Monthly Rent Collected</Text>
              <Text style={styles.revenueValue}>
                ₹{pgs.reduce((sum, p) => sum + p.roomTypes.reduce((s, r) => s + (r.rent * r.count), 0), 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Platform Commission (Est.)</Text>
              <Text style={styles.revenueValue}>
                ₹{Math.round(pgs.reduce((sum, p) => sum + p.roomTypes.reduce((s, r) => s + (r.rent * r.count * 0.08), 0), 0)).toLocaleString()}
              </Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Your Earnings (Est.)</Text>
              <Text style={styles.revenueValueHighlight}>
                ₹{Math.round(pgs.reduce((sum, p) => sum + p.roomTypes.reduce((s, r) => s + (r.rent * r.count * 0.92), 0), 0)).toLocaleString()}
              </Text>
            </View>
          </View>
          <Text style={styles.revenueNote}>*Based on current occupancy & 8% avg commission. Actual may vary.</Text>
        </View>

        {/* PG Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PG Performance</Text>
          {pgs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyTitle}>No PGs listed</Text>
              <Text style={styles.emptySubtitle}>Add PGs to see performance analytics</Text>
            </View>
          ) : (
            pgs.map((pg) => (
              <View key={pg.id} style={styles.pgAnalyticsCard}>
                <View style={styles.pgAnalyticsHeader}>
                  <Text style={styles.pgAnalyticsTitle}>{pg.title}</Text>
                  <View style={[
                    styles.pgAnalyticsStatus,
                    pg.status === 'active' && styles.pgAnalyticsStatusActive,
                  ]}>
                    <Text style={styles.pgAnalyticsStatusText}>
                      {pg.status}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.pgAnalyticsMetrics}>
                  <View style={styles.pgMetric}>
                    <Text style={styles.pgMetricValue}>{pg.stats.views}</Text>
                    <Text style={styles.pgMetricLabel}>Views</Text>
                  </View>
                  <View style={styles.pgMetric}>
                    <Text style={styles.pgMetricValue}>{pg.stats.enquiries}</Text>
                    <Text style={styles.pgMetricLabel}>Enquiries</Text>
                  </View>
                  <View style={styles.pgMetric}>
                    <Text style={styles.pgMetricValue}>{pg.stats.bookings}</Text>
                    <Text style={styles.pgMetricLabel}>Bookings</Text>
                  </View>
                  <View style={styles.pgMetric}>
                    <Text style={styles.pgMetricValue}>
                      {pg.stats.enquiries > 0 ? ((pg.stats.bookings / pg.stats.enquiries) * 100).toFixed(0) : 0}%
                    </Text>
                    <Text style={styles.pgMetricLabel}>Convert</Text>
                  </View>
                </View>

                {pg.stats.avgRating > 0 && (
                  <View style={styles.pgRating}>
                    <Text style={styles.pgRatingLabel}>Rating: {pg.stats.avgRating.toFixed(1)} ({pg.stats.reviewCount} reviews)</Text>
                    <View style={styles.ratingStars}>
                      {[...Array(5)].map((_, i) => (
                        <Text key={i} style={[
                          styles.ratingStar,
                          i < Math.round(pg.stats.avgRating) && styles.ratingStarFilled,
                        ]}>★</Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Top Performing PGs */}
        {topPGs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Performing PGs</Text>
            {topPGs.map((pg, index) => (
              <View key={pg.id} style={styles.topPGCard}>
                <Text style={styles.topPGNumber}>#{index + 1}</Text>
                <View style={styles.topPGInfo}>
                  <Text style={styles.topPGTitle}>{pg.title}</Text>
                  <Text style={styles.topPGLocation}>📍 {pg.address.city}, {pg.address.state}</Text>
                </View>
                <View style={styles.topPGStats}>
                  <Text style={styles.topPGStat}>
                    <Text style={styles.topPGStatValue}>{pg.stats.views}</Text>
                    <Text style={styles.topPGStatLabel}>Views</Text>
                  </Text>
                  <Text style={styles.topPGStat}>
                    <Text style={styles.topPGStatValue}>{pg.stats.bookings}</Text>
                    <Text style={styles.topPGStatLabel}>Booked</Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights & Recommendations</Text>
          <View style={styles.insightsList}>
            {pgs.filter(p => p.status !== 'active').length > 0 && (
              <View style={styles.insightCard}>
                <Text style={styles.insightIcon}>⚠️</Text>
                <View>
                  <Text style={styles.insightTitle}>Inactive PGs</Text>
                  <Text style={styles.insightText}>
                    {pgs.filter(p => p.status !== 'active').length} PG(s) are not active. Activate them to receive enquiries.
                  </Text>
                </View>
              </View>
            )}
            {pgs.some(p => p.verification.status !== 'verified') && (
              <View style={styles.insightCard}>
                <Text style={styles.insightIcon}>🔍</Text>
                <View>
                  <Text style={styles.insightTitle}>Unverified PGs</Text>
                  <Text style={styles.insightText}>
                    Girls prefer verified PGs. Complete verification to increase trust & bookings.
                  </Text>
                </View>
              </View>
            )}
            {pgs.some(p => p.stats.avgRating < 4 && p.stats.reviewCount > 0) && (
              <View style={styles.insightCard}>
                <Text style={styles.insightIcon}>⭐</Text>
                <View>
                  <Text style={styles.insightTitle}>Low Ratings</Text>
                  <Text style={styles.insightText}>
                    Some PGs have ratings below 4.0. Address feedback to improve conversion.
                  </Text>
                </View>
              </View>
            )}
            {pgs.length > 0 && pgs.every(p => p.stats.views < 50) && (
              <View style={styles.insightCard}>
                <Text style={styles.insightIcon}>📸</Text>
                <View>
                  <Text style={styles.insightTitle}>Low Visibility</Text>
                  <Text style={styles.insightText}>
                    Add more photos, detailed descriptions, and highlight amenities to attract more views.
                  </Text>
                </View>
              </View>
            )}
            {pgs.length === 0 && (
              <View style={styles.insightCard}>
                <Text style={styles.insightIcon}>🚀</Text>
                <View>
                  <Text style={styles.insightTitle}>Get Started</Text>
                  <Text style={styles.insightText}>
                    Add your first PG to start receiving enquiries and building your portfolio.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.lg,
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
  timeRangeContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  timeRangeButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.sm,
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeRangeButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  timeRangeButtonTextActive: {
    color: COLORS.surface,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  metricCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  metricIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  metricValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  metricLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  revenueCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  revenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  revenueDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
  revenueLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  revenueValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  revenueValueHighlight: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  revenueNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDisabled,
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  pgAnalyticsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  pgAnalyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pgAnalyticsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pgAnalyticsStatus: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  pgAnalyticsStatusActive: {
    backgroundColor: COLORS.secondaryLight,
  },
  pgAnalyticsStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  pgAnalyticsMetrics: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  pgMetric: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  pgMetricValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pgMetricLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  pgRating: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  pgRatingLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  ratingStar: {
    fontSize: FONT_SIZES.md,
    color: COLORS.border,
  },
  ratingStarFilled: {
    color: COLORS.warning,
  },
  topPGCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  topPGNumber: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.md,
    minWidth: 30,
  },
  topPGInfo: {
    flex: 1,
  },
  topPGTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  topPGLocation: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  topPGStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  topPGStat: {
    alignItems: 'center',
  },
  topPGStatValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  topPGStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  insightsList: {
    gap: SPACING.md,
  },
  insightCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  insightIcon: {
    fontSize: 24,
    marginTop: SPACING.xs,
  },
  insightTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  insightText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});