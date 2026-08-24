import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  SHADOWS,
  ENQUIRY_STATUS_LABELS,
  PG_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
} from "../../constants";
import { PG, Enquiry } from "../../types";
import { getPGsByOwner, getEnquiriesByOwner } from "../../services/firestore";

export function OwnerDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [pgs, setPgs] = React.useState<PG[]>([]);
  const [enquiries, setEnquiries] = React.useState<Enquiry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [pgsData, enquiriesData] = await Promise.all([
        getPGsByOwner(user.uid),
        getEnquiriesByOwner(user.uid),
      ]);

      setPgs(pgsData);
      setEnquiries(enquiriesData);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      Alert.alert("Error", "Failed to load dashboard");
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

  // Stats
  const totalPGs = pgs.length;
  const activePGs = pgs.filter((p) => p.status === "active").length;
  const totalEnquiries = enquiries.length;
  const newEnquiries = enquiries.filter((e) => e.status === "new").length;
  const totalViews = pgs.reduce((sum, p) => sum + p.stats.views, 0);
  const totalBookings = pgs.reduce((sum, p) => sum + p.stats.bookings, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>
              {user?.name?.split(" ")[0] || "Owner"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addPGButton}
            onPress={() => navigation.navigate("AddPG")}
          >
            <Text style={styles.addPGButtonText}>+ Add PG</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalPGs}</Text>
            <Text style={styles.statLabel}>Total PGs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activePGs}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalEnquiries}</Text>
            <Text style={styles.statLabel}>Total Enquiries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{newEnquiries}</Text>
            <Text style={styles.statLabel}>New</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalViews}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalBookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("AddPG")}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionLabel}>Add New PG</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("OwnerEnquiries")}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionLabel}>Manage Enquiries</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("OwnerAnalytics")}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>View Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("OwnerPayouts")}
            >
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionLabel}>Payouts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Enquiries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Enquiries</Text>
            <TouchableOpacity
              style={styles.viewAll}
              onPress={() => navigation.navigate("OwnerEnquiries")}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {enquiries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No enquiries yet</Text>
              <Text style={styles.emptySubtitle}>
                Enquiries will appear here when girls contact you
              </Text>
            </View>
          ) : (
            enquiries.slice(0, 5).map((enquiry, index) => (
              <TouchableOpacity
                key={enquiry.id}
                style={styles.enquiryCard}
                onPress={() =>
                  navigation.navigate("ChatDetail", { enquiryId: enquiry.id })
                }
              >
                <View style={styles.enquiryLeft}>
                  <View
                    style={[
                      styles.statusDot,
                      enquiry.status === "new" && styles.statusDotNew,
                    ]}
                  />
                  <View>
                    <Text style={styles.enquiryTitle}>PG Enquiry</Text>
                    <Text style={styles.enquiryMeta}>
                      {new Date(enquiry.createdAt).toLocaleDateString()} •{" "}
                      {ENQUIRY_STATUS_LABELS[enquiry.status] || enquiry.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.enquiryRight}>
                  <Text style={styles.enquiryStatus}>
                    {ENQUIRY_STATUS_LABELS[enquiry.status] || enquiry.status}
                  </Text>
                  <Text style={styles.enquiryChevron}>›</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* My PGs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My PGs</Text>
            <TouchableOpacity
              style={styles.viewAll}
              onPress={() => navigation.navigate("AddPG")}
            >
              <Text style={styles.viewAllText}>Manage All</Text>
            </TouchableOpacity>
          </View>

          {pgs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyTitle}>No PGs listed yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your first PG to start receiving enquiries
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate("AddPG")}
              >
                <Text style={styles.primaryButtonText}>Add PG Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            pgs.slice(0, 3).map((pg, index) => (
              <TouchableOpacity
                key={pg.id}
                style={styles.pgCard}
                onPress={() => Alert.alert("PG Details", pg.title)}
              >
                <View style={styles.pgCardLeft}>
                  {pg.photos[0] ? (
                    <Image
                      source={{ uri: pg.photos[0] }}
                      style={styles.pgCardImage}
                    />
                  ) : (
                    <View style={styles.pgCardImagePlaceholder}>
                      <Text style={styles.placeholderText}>🏠</Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.pgCardTitle}>{pg.title}</Text>
                    <Text style={styles.pgCardLocation}>
                      📍 {pg.address.city}, {pg.address.state}
                    </Text>
                  </View>
                </View>
                <View style={styles.pgCardRight}>
                  <View
                    style={[
                      styles.statusBadge,
                      pg.status === "active" && styles.statusActive,
                      pg.status === "inactive" && styles.statusInactive,
                      pg.status === "draft" && styles.statusDraft,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {PG_STATUS_LABELS[pg.status]}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.verificationBadge,
                      pg.verification.status === "verified" &&
                        styles.verificationVerified,
                    ]}
                  >
                    <Text style={styles.verificationBadgeText}>
                      {VERIFICATION_STATUS_LABELS[pg.verification.status]}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  welcomeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  nameText: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  addPGButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  addPGButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: "700",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  viewAll: {
    padding: SPACING.xs,
  },
  viewAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    ...SHADOWS.sm,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: "center",
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
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
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
  enquiryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  enquiryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textDisabled,
  },
  statusDotNew: {
    backgroundColor: COLORS.accent,
  },
  enquiryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  enquiryMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  enquiryRight: {
    alignItems: "flex-end",
  },
  enquiryStatus: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  enquiryChevron: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textDisabled,
  },
  pgCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  pgCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  },
  pgCardImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
  },
  pgCardImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.divider,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 24,
  },
  pgCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  pgCardLocation: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  pgCardRight: {
    alignItems: "flex-end",
    gap: SPACING.xs,
  },
  statusBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  statusActive: {
    backgroundColor: COLORS.secondaryLight,
  },
  statusInactive: {
    backgroundColor: COLORS.textDisabled + "20",
  },
  statusDraft: {
    backgroundColor: COLORS.accent + "20",
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
  },
  verificationBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  verificationVerified: {
    backgroundColor: COLORS.secondaryLight,
  },
  verificationBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
});
