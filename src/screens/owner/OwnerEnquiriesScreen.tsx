import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, ENQUIRY_STATUS_LABELS } from '../../constants';
import { Enquiry } from '../../types';
import { getEnquiriesByOwner, updateEnquiry } from '../../services/firestore';

export function OwnerEnquiriesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = React.useState<Enquiry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [filter, setFilter] = React.useState<string>('all');

  const loadEnquiries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getEnquiriesByOwner(user.uid);
      setEnquiries(data);
    } catch (error) {
      console.error('Error loading enquiries:', error);
      Alert.alert('Error', 'Failed to load enquiries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadEnquiries();
  }, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEnquiries();
  };

  const handleStatusChange = async (enquiryId: string, newStatus: Enquiry['status']) => {
    try {
      await updateEnquiry(enquiryId, { status: newStatus });
      setEnquiries(prev => prev.map(e => e.id === enquiryId ? { ...e, status: newStatus } : e));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };

  const filteredEnquiries = enquiries.filter(e => 
    filter === 'all' || e.status === filter
  );

  const statusOptions = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'responded', label: 'Responded' },
    { key: 'visit-scheduled', label: 'Visit Scheduled' },
    { key: 'booking-confirmed', label: 'Booked' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

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
          <Text style={styles.title}>Enquiries</Text>
          <Text style={styles.subtitle}>Manage all PG enquiries</Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterTab,
                filter === option.key && styles.filterTabActive,
              ]}
              onPress={() => setFilter(option.key)}
            >
              <Text style={[
                styles.filterTabText,
                filter === option.key && styles.filterTabTextActive,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Enquiries List */}
        {filteredEnquiries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No enquiries yet' : `No ${filter} enquiries`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'Enquiries will appear here when girls contact you' 
                : 'Try a different filter'}
            </Text>
          </View>
        ) : (
          filteredEnquiries.map((enquiry, index) => (
            <TouchableOpacity
              key={enquiry.id}
              style={styles.enquiryCard}
              onPress={() => navigation.navigate('ChatDetail', { enquiryId: enquiry.id })}
            >
              <View style={styles.enquiryHeader}>
                <View style={styles.enquiryLeft}>
                  <View style={[
                    styles.statusDot,
                    enquiry.status === 'new' && styles.statusDotNew,
                    enquiry.status === 'visit-scheduled' && styles.statusDotVisit,
                    enquiry.status === 'booking-confirmed' && styles.statusDotBooked,
                  ]} />
                  <View>
                    <Text style={styles.enquiryTitle}>Enquiry #{enquiry.id.slice(-6)}</Text>
                    <Text style={styles.enquiryMeta}>
                      PG: {enquiry.pgId?.slice(0, 8)}... • {new Date(enquiry.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.enquiryRight}>
                  <Text style={[
                    styles.statusBadge,
                    enquiry.status === 'new' && styles.statusNew,
                    enquiry.status === 'responded' && styles.statusResponded,
                    enquiry.status === 'visit-scheduled' && styles.statusVisit,
                    enquiry.status === 'booking-confirmed' && styles.statusBooked,
                    enquiry.status === 'rejected' && styles.statusRejected,
                    enquiry.status === 'cancelled' && styles.statusCancelled,
                  ]}>
                    {ENQUIRY_STATUS_LABELS[enquiry.status] || enquiry.status}
                  </Text>
                </View>
              </View>

              <View style={styles.enquiryMessage}>
                <Text style={styles.messageLabel}>Message:</Text>
                <Text style={styles.messageText} numberOfLines={2}>
                  {enquiry.message}
                </Text>
              </View>

              {enquiry.visitDate && (
                <View style={styles.visitInfo}>
                  <Text style={styles.visitLabel}>📅 Visit Scheduled:</Text>
                  <Text style={styles.visitValue}>
                    {new Date(enquiry.visitDate).toLocaleString()}
                  </Text>
                </View>
              )}

              {enquiry.bookingDetails && (
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingLabel}>📋 Booking Confirmed</Text>
                  <Text style={styles.bookingValue}>
                    Room: {enquiry.bookingDetails.roomTypeId} • Move-in: {new Date(enquiry.bookingDetails.moveInDate).toLocaleDateString()}
                  </Text>
                  <Text style={styles.bookingValue}>
                    Rent: ₹{enquiry.bookingDetails.agreedRent.toLocaleString()} • Commission: ₹{enquiry.bookingDetails.commission.toLocaleString()}
                  </Text>
                </View>
              )}

              {/* Quick Actions */}
              {(enquiry.status === 'new' || enquiry.status === 'responded') && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusChange(enquiry.id, 'responded')}
                  >
                    <Text style={styles.actionButtonText}>✓ Responded</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButtonPrimary}
                    onPress={() => handleStatusChange(enquiry.id, 'visit-scheduled')}
                  >
                    <Text style={styles.actionButtonTextPrimary}>📅 Schedule Visit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButtonDanger}
                    onPress={() => handleStatusChange(enquiry.id, 'rejected')}
                  >
                    <Text style={styles.actionButtonTextDanger}>✗ Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {enquiry.status === 'visit-scheduled' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionButtonPrimary}
                    onPress={() => Alert.alert('Confirm Booking', 'Mark as booked?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Confirm', onPress: () => handleStatusChange(enquiry.id, 'booking-confirmed') },
                    ])}
                  >
                    <Text style={styles.actionButtonTextPrimary}>✓ Confirm Booking</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButtonDanger}
                    onPress={() => handleStatusChange(enquiry.id, 'cancelled')}
                  >
                    <Text style={styles.actionButtonTextDanger}>✗ Cancel Visit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
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
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  filterTab: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.sm,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: COLORS.surface,
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
  enquiryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  enquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  enquiryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.textDisabled,
  },
  statusDotNew: {
    backgroundColor: COLORS.accent,
  },
  statusDotVisit: {
    backgroundColor: COLORS.primary,
  },
  statusDotBooked: {
    backgroundColor: COLORS.secondary,
  },
  enquiryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  enquiryMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  enquiryRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  statusNew: {
    backgroundColor: COLORS.accent + '20',
  },
  statusResponded: {
    backgroundColor: COLORS.primaryLight,
  },
  statusVisit: {
    backgroundColor: COLORS.primary + '20',
  },
  statusBooked: {
    backgroundColor: COLORS.secondaryLight,
  },
  statusRejected: {
    backgroundColor: COLORS.error + '20',
  },
  statusCancelled: {
    backgroundColor: COLORS.textDisabled + '20',
  },
  enquiryMessage: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  messageLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  messageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  visitInfo: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  visitLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primaryDark,
    marginBottom: SPACING.xs,
  },
  visitValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  bookingInfo: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bookingLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.secondaryDark,
    marginBottom: SPACING.xs,
  },
  bookingValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.secondaryDark,
    marginBottom: SPACING.xs,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  actionButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  actionButtonDanger: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionButtonTextPrimary: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.surface,
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    fontWeight: '600',
  },
});