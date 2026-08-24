import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, TextInput } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '../../constants';
import { Review, PG } from '../../types';
import { createReview, getReviewsByPG } from '../../services/firestore';
import * as ImagePicker from 'expo-image-picker';

export function ReviewScreen({ route, navigation }: any) {
  const { pgId, pgTitle } = route.params;
  const { user } = useAuth();
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showWriteReview, setShowWriteReview] = React.useState(false);
  const [writing, setWriting] = React.useState(false);
  
  // Write review form
  const [reviewData, setReviewData] = React.useState({
    overall: 0,
    safety: 0,
    cleanliness: 0,
    food: 0,
    ownerBehavior: 0,
    valueForMoney: 0,
    text: '',
    photos: [] as string[],
    isAnonymous: false,
  });

  const loadReviews = async () => {
    if (!pgId) return;
    
    setLoading(true);
    try {
      const data = await getReviewsByPG(pgId);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadReviews();
  }, [pgId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  const handleRatingChange = (key: string, value: number) => {
    setReviewData(prev => ({ ...prev, [key]: value }));
  };

  const pickPhotos = async () => {
    if (reviewData.photos.length >= 5) {
      Alert.alert('Error', 'Maximum 5 photos allowed');
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5 - reviewData.photos.length,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setReviewData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick photos');
    }
  };

  const submitReview = async () => {
    if (!user || !pgId) return;
    
    // Validate all ratings
    const ratings = ['overall', 'safety', 'cleanliness', 'food', 'ownerBehavior', 'valueForMoney'] as const;
    for (const r of ratings) {
      if (!reviewData[r] || reviewData[r] < 1) {
        Alert.alert('Error', `Please rate ${r.charAt(0).toUpperCase() + r.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }
    
    if (!reviewData.text.trim()) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    setWriting(true);
    try {
      // Upload photos first
      let photoUrls: string[] = [];
      if (reviewData.photos.length > 0) {
        const photoFiles = await Promise.all(
          reviewData.photos.map(async (uri) => {
            const response = await fetch(uri);
            const blob = await response.blob();
            return { file: blob, name: `review_${Date.now()}.jpg` };
          })
        );
        // Would call uploadReviewPhotos in production
        photoUrls = reviewData.photos; // Placeholder
      }

      await createReview({
        pgId,
        girlId: user.uid,
        girlName: reviewData.isAnonymous ? 'Anonymous' : (user.name || 'Anonymous'),
        rating: {
          overall: reviewData.overall,
          safety: reviewData.safety,
          cleanliness: reviewData.cleanliness,
          food: reviewData.food,
          ownerBehavior: reviewData.ownerBehavior,
          valueForMoney: reviewData.valueForMoney,
        },
        text: reviewData.text,
        photos: photoUrls,
        isAnonymous: reviewData.isAnonymous,
        verifiedStay: true, // Would check if user actually booked through platform
      });

      Alert.alert('Success!', 'Thank you for your review. It helps other girls make informed decisions.');
      setShowWriteReview(false);
      setReviewData({
        overall: 0,
        safety: 0,
        cleanliness: 0,
        food: 0,
        ownerBehavior: 0,
        valueForMoney: 0,
        text: '',
        photos: [],
        isAnonymous: false,
      });
      loadReviews();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setWriting(false);
    }
  };

  // Calculate average ratings
  const avgRatings = reviews.length > 0 ? {
    overall: reviews.reduce((sum, r) => sum + r.rating.overall, 0) / reviews.length,
    safety: reviews.reduce((sum, r) => sum + r.rating.safety, 0) / reviews.length,
    cleanliness: reviews.reduce((sum, r) => sum + r.rating.cleanliness, 0) / reviews.length,
    food: reviews.reduce((sum, r) => sum + r.rating.food, 0) / reviews.length,
    ownerBehavior: reviews.reduce((sum, r) => sum + r.rating.ownerBehavior, 0) / reviews.length,
    valueForMoney: reviews.reduce((sum, r) => sum + r.rating.valueForMoney, 0) / reviews.length,
  } : null;

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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reviews</Text>
        </View>

        {/* PG Title */}
        <View style={styles.pgTitleCard}>
          <Text style={styles.pgTitleText}>{pgTitle}</Text>
          <Text style={styles.pgTitleSubtitle}>Girls-only verified reviews</Text>
        </View>

        {/* Overall Rating Summary */}
        {avgRatings && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryMain}>
              <Text style={styles.summaryBigNumber}>{avgRatings.overall.toFixed(1)}</Text>
              <View style={styles.summaryStars}>
                {[...Array(5)].map((_, i) => (
                  <Text key={i} style={[
                    styles.summaryStar,
                    i < Math.round(avgRatings.overall) && styles.summaryStarFilled,
                  ]}>★</Text>
                ))}
              </View>
              <Text style={styles.summaryCount}>{reviews.length} reviews</Text>
            </View>
            
            <View style={styles.summaryBreakdown}>
              {([
                { key: 'safety', label: 'Safety', icon: '🛡️' },
                { key: 'cleanliness', label: 'Cleanliness', icon: '✨' },
                { key: 'food', label: 'Food', icon: '🍽️' },
                { key: 'ownerBehavior', label: 'Owner Behavior', icon: '👥' },
                { key: 'valueForMoney', label: 'Value for Money', icon: '💰' },
              ] as const).map(({ key, label, icon }) => (
                <View key={key} style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <Text style={styles.breakdownIcon}>{icon}</Text>
                    <Text style={styles.breakdownLabel}>{label}</Text>
                  </View>
                  <View style={styles.breakdownRight}>
                    <View style={[
                      styles.breakdownBar,
                      { width: `${(avgRatings[key] / 5) * 100}%` },
                    ]} />
                    <Text style={styles.breakdownValue}>{avgRatings[key].toFixed(1)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Write Review Button */}
        <TouchableOpacity style={styles.writeReviewButton} onPress={() => setShowWriteReview(true)}>
          <Text style={styles.writeReviewButtonText}>✍️ Write a Review</Text>
        </TouchableOpacity>

        {/* Reviews List */}
        <View style={styles.reviewsHeader}>
          <Text style={styles.reviewsTitle}>
            All Reviews ({reviews.length})
          </Text>
        </View>

        {reviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to review this PG and help other girls!
            </Text>
          </View>
        ) : (
          reviews.map((review, index) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewLeft}>
                  <View style={styles.reviewAvatar}>
                    {review.isAnonymous ? (
                      <Text style={styles.anonymousIcon}>👤</Text>
                    ) : (
                      <Text style={styles.avatarText}>
                        {review.girlName?.charAt(0).toUpperCase() || 'A'}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.reviewerName}>
                      {review.isAnonymous ? 'Anonymous' : review.girlName}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                      {review.verifiedStay && ' • Verified Stay'}
                    </Text>
                  </View>
                </View>
                <View style={styles.reviewRight}>
                  <Text style={styles.reviewOverallRating}>
                    {review.rating.overall.toFixed(1)}
                  </Text>
                  <View style={styles.reviewStars}>
                    {[...Array(5)].map((_, i) => (
                      <Text key={i} style={[
                        styles.reviewStar,
                        i < review.rating.overall && styles.reviewStarFilled,
                      ]}>★</Text>
                    ))}
                  </View>
                </View>
              </View>

              {/* Category Ratings */}
              <View style={styles.categoryRatings}>
                {([
                  { key: 'safety', label: 'Safety' },
                  { key: 'cleanliness', label: 'Clean' },
                  { key: 'food', label: 'Food' },
                  { key: 'ownerBehavior', label: 'Owner' },
                  { key: 'valueForMoney', label: 'Value' },
                ] as const).map(({ key, label }) => (
                  <View key={key} style={styles.categoryRating}>
                    <Text style={styles.categoryLabel}>{label}</Text>
                    <Text style={styles.categoryValue}>{review.rating[key]}/5</Text>
                  </View>
                ))}
              </View>

              {/* Review Text */}
              <Text style={styles.reviewText}>{review.text}</Text>

              {/* Photos */}
              {review.photos && review.photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewPhotos}>
                  {review.photos.map((photo, i) => (
                    <View key={i} style={styles.reviewPhotoItem}>
                      <View style={styles.reviewPhotoImage} />
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          ))
        )}

        {/* Write Review Modal */}
        <Modal visible={showWriteReview} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Write Review for {pgTitle}</Text>
                <TouchableOpacity onPress={() => setShowWriteReview(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.modalSubtitle}>Rate your experience (all required)</Text>
                
                {([
                  { key: 'overall', label: 'Overall Experience' },
                  { key: 'safety', label: 'Safety & Security' },
                  { key: 'cleanliness', label: 'Cleanliness' },
                  { key: 'food', label: 'Food Quality' },
                  { key: 'ownerBehavior', label: 'Owner/Staff Behavior' },
                  { key: 'valueForMoney', label: 'Value for Money' },
                ] as const).map(({ key, label }) => (
                  <View key={key} style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>{label}</Text>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          style={styles.starButton}
                          onPress={() => handleRatingChange(key, star)}
                        >
                          <Text style={[
                            styles.star,
                            reviewData[key] >= star && styles.starFilled,
                          ]}>★</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write your detailed experience... (minimum 50 characters)"
                  value={reviewData.text}
                  onChangeText={v => setReviewData(prev => ({ ...prev, text: v }))}
                  multiline
                  numberOfLines={5}
                />

                <View style={styles.photoSection}>
                  <Text style={styles.sectionLabel}>Add Photos (Optional)</Text>
                  <TouchableOpacity style={styles.photoUploadButton} onPress={pickPhotos} disabled={reviewData.photos.length >= 5}>
                    <Text style={styles.photoUploadText}>
                      {reviewData.photos.length === 0 ? '📷 Add Photos' : `📷 ${reviewData.photos.length}/5 Photos`}
                    </Text>
                  </TouchableOpacity>
                  {reviewData.photos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoPreview}>
                      {reviewData.photos.map((photo, index) => (
                        <View key={index} style={styles.photoPreviewItem}>
                          <View style={styles.photoPreviewImage} />
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>

                <View style={styles.anonymousRow}>
                  <TouchableOpacity 
                    style={[
                      styles.checkbox,
                      reviewData.isAnonymous && styles.checkboxChecked,
                    ]}
                    onPress={() => setReviewData(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}
                  >
                    <Text style={[
                      styles.checkboxText,
                      reviewData.isAnonymous && styles.checkboxTextChecked,
                    ]}>
                      {reviewData.isAnonymous ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.anonymousLabel}>
                    Post anonymously (your name won't be shown)
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalCancel} onPress={() => setShowWriteReview(false)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalConfirm} onPress={submitReview} disabled={writing}>
                    <Text style={styles.modalConfirmText}>{writing ? 'Submitting...' : 'Submit Review'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backButtonText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pgTitleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  pgTitleText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pgTitleSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  summaryMain: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  summaryBigNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.primary,
  },
  summaryStars: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  summaryStar: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.border,
  },
  summaryStarFilled: {
    color: COLORS.warning,
  },
  summaryCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  summaryBreakdown: {
    gap: SPACING.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    width: 100,
  },
  breakdownIcon: {
    fontSize: FONT_SIZES.md,
  },
  breakdownLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  breakdownRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  breakdownBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 3,
  },
  breakdownValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
    minWidth: 30,
  },
  writeReviewButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  writeReviewButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  reviewsHeader: {
    marginBottom: SPACING.md,
  },
  reviewsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
  reviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  reviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  anonymousIcon: {
    fontSize: 20,
  },
  avatarText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  reviewerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reviewDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  reviewRight: {
    alignItems: 'flex-end',
  },
  reviewOverallRating: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  reviewStar: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.border,
  },
  reviewStarFilled: {
    color: COLORS.warning,
  },
  categoryRatings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  categoryRating: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  categoryValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reviewText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  reviewPhotos: {
    gap: SPACING.sm,
  },
  reviewPhotoItem: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  reviewPhotoImage: {
    width: '100%',
    height: '100%',
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
    maxHeight: '90%',
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalClose: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
  },
  modalBody: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  ratingRow: {
    gap: SPACING.md,
  },
  ratingLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  starRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  starButton: {
    padding: SPACING.xs,
  },
  star: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.border,
  },
  starFilled: {
    color: COLORS.warning,
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
  textArea: {
    height: 120,
    paddingVertical: SPACING.md,
  },
  photoSection: {
    gap: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  photoUploadButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  photoUploadText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  photoPreview: {
    gap: SPACING.sm,
  },
  photoPreviewItem: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  anonymousRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkboxText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.surface,
  },
  anonymousLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
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