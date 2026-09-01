import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, ScrollView, Modal, TextInput, FlatList } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '../../constants';
import { CommissionTransaction } from '../../types';
import { getCommissionTransactionsByOwner } from '../../services/firestore';

export function OwnerPayoutsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [transactions, setTransactions] = React.useState<CommissionTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showPayoutModal, setShowPayoutModal] = React.useState(false);
  const [payoutAmount, setPayoutAmount] = React.useState('');
  const [payoutUpiId, setPayoutUpiId] = React.useState('');
  const [requestingPayout, setRequestingPayout] = React.useState(false);

  const loadTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getCommissionTransactionsByOwner(user.uid);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load payouts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadTransactions();
  }, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  // Calculate totals
  const totalEarned = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.ownerPayout, 0);
  const pendingPayout = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.ownerPayout, 0);
  const totalCommissionPaid = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.platformFee, 0);

  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      Alert.alert('Error', 'Enter valid amount');
      return;
    }
    if (!payoutUpiId || !payoutUpiId.includes('@')) {
      Alert.alert('Error', 'Enter valid UPI ID (e.g., name@bank)');
      return;
    }
    
    const amount = parseFloat(payoutAmount);
    if (amount > pendingPayout) {
      Alert.alert('Error', `Cannot withdraw more than available balance (₹${pendingPayout.toLocaleString()})`);
      return;
    }

    setRequestingPayout(true);
    try {
      // In production: call cloud function to create RazorpayX payout
      // await requestPayout(user.uid, amount, payoutUpiId);
      
      Alert.alert('Success!', `Payout request of ₹${amount.toLocaleString()} submitted. Will be processed within 24 hours.`);
      setShowPayoutModal(false);
      setPayoutAmount('');
      setPayoutUpiId('');
      loadTransactions(); // Refresh
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to request payout');
    } finally {
      setRequestingPayout(false);
    }
  };

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
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Payouts</Text>
            <Text style={styles.subtitle}>Track earnings & withdrawals</Text>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Earned</Text>
              <Text style={styles.summaryValue}>₹{totalEarned.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Available Balance</Text>
              <Text style={styles.summaryValue}>₹{pendingPayout.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Paid Out</Text>
              <Text style={styles.summaryValue}>₹{totalPaidOut.toLocaleString()}</Text>
            </View>
          </View>

          {/* Withdrawal Button */}
          <TouchableOpacity style={styles.withdrawButton} onPress={() => setShowPayoutModal(true)} disabled={pendingPayout < 100}>
            <Text style={styles.withdrawButtonText}>
              {pendingPayout < 100 ? 'Min ₹100 to withdraw' : 'Request Withdrawal'}
            </Text>
          </TouchableOpacity>

          {/* Transaction History */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transaction History</Text>
              <TouchableOpacity style={styles.viewAll} onPress={() => setShowHistory(true)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>Complete bookings to see earnings here</Text>
              </View>
            ) : (
              <FlatList
                data={recentTransactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.transactionCard} onPress={() => setSelectedTransaction(item)}>
                    <View style={styles.transactionMain}>
                      <View style={styles.transactionIcon}>
                        <Text>{item.type === 'credit' ? '💰' : '🏦'}</Text>
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionTitle}>
                          {item.type === 'credit' ? 'Booking Commission' : 'Payout to UPI'}
                        </Text>
                        <Text style={styles.transactionMeta}>
                          {item.pgName} • {new Date(item.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text style={[styles.amountText, item.type === 'credit' ? styles.amountCredit : styles.amountDebit]}>
                        {item.type === 'credit' ? '+' : '-'}₹{item.amount.toLocaleString()}
                      </Text>
                      <Text style={styles.amountStatus}>{item.status}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Withdrawal Modal */}
      <Modal visible={showPayoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Payout</Text>
              <TouchableOpacity onPress={() => setShowPayoutModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalInfo}>
                Available balance: <Text style={styles.modalInfoHighlight}>₹{pendingPayout.toLocaleString()}</Text>
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Amount to withdraw (₹)"
                value={payoutAmount}
                onChangeText={setPayoutAmount}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="UPI ID (e.g., name@bank)"
                value={payoutUpiId}
                onChangeText={setPayoutUpiId}
                autoCapitalize="none"
              />

              <Text style={styles.modalNote}>
                Minimum ₹100 • Processing within 24 hours • No fees
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowPayoutModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleRequestPayout} disabled={requestingPayout}>
                <Text style={styles.modalConfirmText}>{requestingPayout ? 'Processing...' : 'Request Payout'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedTransaction && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.type === 'credit' ? 'Commission Earned' : 'Payout Requested'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={[styles.detailValue, selectedTransaction.type === 'credit' ? styles.amountCredit : styles.amountDebit]}>
                    {selectedTransaction.type === 'credit' ? '+' : '-'}₹{selectedTransaction.amount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>PG</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.pgName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{new Date(selectedTransaction.date).toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.status}</Text>
                </View>
                {selectedTransaction.utr && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>UTR/Ref</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.utr}</Text>
                  </View>
                )}
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowHistory(false)}>
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

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
  summaryGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  summaryIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  requestPayoutButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  requestPayoutButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
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
  transactionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  transactionLeft: {
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
  statusDotPaid: {
    backgroundColor: COLORS.secondary,
  },
  statusDotPending: {
    backgroundColor: COLORS.accent,
  },
  statusDotFailed: {
    backgroundColor: COLORS.error,
  },
  transactionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  transactionMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  amountPositive: {
    color: COLORS.secondary,
  },
  amountNegative: {
    color: COLORS.error,
  },
  statusBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  statusPaid: {
    backgroundColor: COLORS.secondaryLight,
  },
  statusPending: {
    backgroundColor: COLORS.accent + '20',
  },
  statusFailed: {
    backgroundColor: COLORS.error + '20',
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  transactionDetails: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  detailValueHighlight: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalClose: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
  },
  modalBody: {
    gap: SPACING.md,
  },
  modalInfo: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalInfoHighlight: {
    fontWeight: '700',
    color: COLORS.secondary,
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
  },
  modalNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDisabled,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
}
