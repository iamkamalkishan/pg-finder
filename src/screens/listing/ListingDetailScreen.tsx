import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, TextInput, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, AMENITY_LABELS, SAFETY_FEATURE_LABELS, PROPERTY_TYPE_LABELS, GUEST_POLICY_LABELS, RATING_CATEGORIES, SAFETY_SCORE_FACTORS } from '../../constants';
import { PG, Enquiry, User } from '../../types';
import { getPG, createEnquiry, getEnquiriesByGirl, sendMessage, uploadChatImage } from '../../services/firestore';
import { uploadFile } from '../../services/storage';
import * as ImagePicker from 'expo-image-picker';

interface RouteParams {
  pgId: string;
}

export function ListingDetailScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [pg, setPg] = React.useState<PG | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [enquiring, setEnquiring] = React.useState(false);
  const [enquiryMessage, setEnquiryMessage] = React.useState('');
  const [showEnquiryModal, setShowEnquiryModal] = React.useState(false);
  const [existingEnquiry, setExistingEnquiry] = React.useState<Enquiry | null>(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [showImageModal, setShowImageModal] = React.useState(false);

  React.useEffect(() => {
    loadPG();
    checkExistingEnquiry();
  }, [route.params?.pgId]);

  const loadPG = async () => {
    if (!route.params?.pgId) return;
    try {
      const data = await getPG(route.params.pgId);
      setPg(data);
    } catch (error) {
      console.error('Error loading PG:', error);
      Alert.alert('Error', 'Failed to load PG details');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingEnquiry = async () => {
    if (!user || !route.params?.pgId) return;
    try {
      const enquiries = await getEnquiriesByGirl(user.uid);
      const found = enquiries.find(e => e.pgId === route.params.pgId);
      if (found) setExistingEnquiry(found);
    } catch (error) {
      console.error('Error checking enquiry:', error);
    }
  };

  const handleEnquire = async () => {
    if (!user || !pg) return;
    if (!enquiryMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setEnquiring(true);
    try {
      const enquiryId = await createEnquiry({
        pgId: pg.id,
        girlId: user.uid,
        ownerId: pg.ownerId,
        message: enquiryMessage,
        status: 'new',
      });
      
      // Send initial message
      await sendMessage({
        enquiryId,
        senderId: user.uid,
        senderRole: 'girl',
        text: enquiryMessage,
        type: 'text',
        read: false,
      });

      setExistingEnquiry({
        id: enquiryId,
        pgId: pg.id,
        girlId: user.uid,
        ownerId: pg.ownerId,
        message: enquiryMessage,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      setShowEnquiryModal(false);
      setEnquiryMessage('');
      Alert.alert('Success', 'Enquiry sent! Owner will contact you soon.');
      
      // Navigate to chat
      navigation.navigate('ChatDetail', { enquiryId });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send enquiry');
    } finally {
      setEnquiring(false);
    }
  };

  const handleContactOwner = () => {
    if (existingEnquiry) {
      navigation.navigate('ChatDetail', { enquiryId: existingEnquiry.id });
    } else {
      setShowEnquiryModal(true);
    }
  };

  const calculateSafetyScore = (pg: PG): number => {
    let score = 0;
    pg.safetyFeatures.forEach(feature => {
      score += SAFETY_SCORE_FACTORS[feature] || 0;
    });
    if (pg.verification.status === 'verified') score += SAFETY_SCORE_FACTORS.verifiedOwner;
    if (pg.stats.avgRating >= 4) score += SAFETY_SCORE_FACTORS.goodReviews;
    return Math.min(score, 100);
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return COLORS.secondary;
    if (score >= 60) return COLORS.accent;
    return COLORS.error;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading PG details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pg) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>PG Not Found</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const safetyScore = calculateSafetyScore(pg);

  return (
    <>
      <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {pg.photos.length > 0 ? (
            <FlatList
              data={pg.photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.galleryImageWrapper}
                  onPress={() => { setActiveImageIndex(index); setShowImageModal(true); }}
                >
                  <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="cover" />
                </TouchableOpacity>
              )}
              keyExtractor={(_, index) => index.toString()}
              onScroll={({ nativeEvent }) => {
                const index = Math.round(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
                setActiveImageIndex(index);
              }}
            />
          ) : (
            <View style={[styles.galleryImageWrapper, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>🏠</Text>
            </View>
          )}
          
          {/* Image Indicators */}
          {pg.photos.length > 1 && (
            <View style={styles.indicators}>
              {pg.photos.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.indicator,
                    i === activeImageIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Badges */}
          <View style={styles.badges}>
            <View style={[
              styles.badge,
              pg.verification.status === 'verified' && styles.badgeVerified,
            ]}>
              <Text style={[
                styles.badgeText,
                pg.verification.status === 'verified' && styles.badgeTextVerified,
              ]}>
                {pg.verification.status === 'verified' ? '✓ Verified' : 'Pending Verification'}
              </Text>
            </View>
            
            {/* Safety Score */}
            <View style={styles.safetyBadge}>
              <View style={[
                styles.scoreCircle,
                { borderColor: getSafetyScoreColor(safetyScore) },
              ]}>
                <Text style={[
                  styles.scoreText,
                  { color: getSafetyScoreColor(safetyScore) },
                ]}>
                  {safetyScore}
                </Text>
              </View>
              <Text style={styles.safetyLabel}>Safety Score</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Title & Type */}
          <View style={styles.header}>
            <Text style={styles.title}>{pg.title}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{PROPERTY_TYPE_LABELS[pg.propertyType]}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📍 Location</Text>
            <Text style={styles.address}>
              {pg.address.line1}
              {pg.address.line2 && `, ${pg.address.line2}`}
              , {pg.address.city}, {pg.address.state} - {pg.address.pincode}
            </Text>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>💰 Pricing</Text>
            <View style={styles.pricingRow}>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Rent</Text>
                <Text style={styles.priceValue}>₹{pg.pricing.rent.toLocaleString()}/month</Text>
              </View>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Deposit</Text>
                <Text style={styles.priceValue}>₹{pg.pricing.deposit.toLocaleString()}</Text>
              </View>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Sharing</Text>
                <Text style={styles.priceValue}>{pg.pricing.sharing} Sharing</Text>
              </View>
            </View>
            {pg.pricing.foodIncluded && (
              <View style={styles.foodInfo}>
                <Text style={styles.foodText}>🍽️ Food Included: ₹{pg.pricing.foodCost?.toLocaleString() || 'Included'}/month</Text>
              </View>
            )}
          </View>

          {/* Room Types */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>🏠 Room Types Available</Text>
            {pg.roomTypes.map((room, i) => (
              <View key={i} style={styles.roomCard}>
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <Text style={styles.roomDetails}>
                    {room.sharing} Sharing • {room.count} rooms • {room.amenities.map(a => AMENITY_LABELS[a] || a).join(', ')}
                  </Text>
                </View>
                <Text style={styles.roomPrice}>₹{room.rent.toLocaleString()}/mo</Text>
              </View>
            ))}
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>✨ Amenities</Text>
            <View style={styles.chipGrid}>
              {pg.amenities.map(amenity => (
                <View key={amenity} style={styles.amenityChip}>
                  <Text style={styles.amenityChipText}>{AMENITY_LABELS[amenity] || amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Safety Features */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>🛡️ Safety Features</Text>
            <View style={styles.chipGrid}>
              {pg.safetyFeatures.map(feature => (
                <View key={feature} style={styles.safetyChip}>
                  <Text style={styles.safetyChipText}>🛡️ {SAFETY_FEATURE_LABELS[feature]}</Text>
                </View>
              ))}
              {pg.safetyFeatures.length === 0 && (
                <Text style={styles.noSafety}>No safety features listed</Text>
              )}
            </View>
          </View>

          {/* Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📋 House Rules</Text>
            {pg.rules.curfewTime && (
              <View style={styles.ruleItem}>
                <Text style={styles.ruleLabel}>Curfew:</Text>
                <Text style={styles.ruleValue}>{pg.rules.curfewTime}</Text>
              </View>
            )}
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Guest Policy:</Text>
              <Text style={styles.ruleValue}>{GUEST_POLICY_LABELS[pg.rules.guestPolicy]}</Text>
            </View>
            {pg.rules.visitorHours && (
              <View style={styles.ruleItem}>
                <Text style={styles.ruleLabel}>Visitor Hours:</Text>
                <Text style={styles.ruleValue}>{pg.rules.visitorHours}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📝 Description</Text>
            <Text style={styles.description}>{pg.description}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{pg.stats.views}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{pg.stats.enquiries}</Text>
              <Text style={styles.statLabel}>Enquiries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{pg.stats.bookings}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{pg.stats.avgRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Contact Owner Button */}
          <TouchableOpacity style={styles.contactButton} onPress={handleContactOwner} disabled={enquiring}>
            <Text style={styles.contactButtonText}>
              {existingEnquiry ? 'Chat with Owner' : 'Contact Owner'}
            </Text>
          </TouchableOpacity>

          {/* SOS Button */}
          <TouchableOpacity style={styles.sosButton} onPress={() => Alert.alert('SOS', 'Emergency feature coming soon')}>
            <Text style={styles.sosButtonText}>🆘 SOS - Emergency Help</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Enquiry Modal */}
      <Modal visible={showEnquiryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Owner</Text>
              <TouchableOpacity onPress={() => setShowEnquiryModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Introduce yourself and ask any questions</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Hi, I'm interested in your PG. Can we schedule a visit?"
              value={enquiryMessage}
              onChangeText={setEnquiryMessage}
              multiline
              numberOfLines={4}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowEnquiryModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleEnquire} disabled={enquiring}>
                <Text style={styles.modalConfirmText}>
                  {enquiring ? 'Sending...' : 'Send Enquiry'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal visible={showImageModal} animationType="fade" transparent>
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity onPress={() => setShowImageModal(false)} style={styles.imageModalClose}>
            <Text style={styles.imageModalCloseText}>✕</Text>
          </TouchableOpacity>
          <FlatList
            data={pg.photos}
            horizontal
            pagingEnabled
            initialScrollIndex={activeImageIndex}
            onScroll={({ nativeEvent }) => {
              const index = Math.round(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
              setActiveImageIndex(index);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.fullScreenImage} />
            )}
            keyExtractor={(_, i) => i.toString()}
          />
          <View style={styles.imageModalCounter}>
            <Text style={styles.imageModalCounterText}>
              {activeImageIndex + 1} / {pg.photos.length}
            </Text>
          </View>
        </View>
      </Modal>
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
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  imageGallery: {
    position: 'relative',
    height: 300,
  },
  galleryImageWrapper: {
    width: '100%',
    height: '100%',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 64,
  },
  indicators: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    backgroundColor: COLORS.surface,
    width: 24,
  },
  badges: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    fontWeight: '500',
  },
  badgeTextVerified: {
    color: COLORS.surface,
  },
  safetyBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  scoreText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  safetyLabel: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.xs,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.md,
  },
  typeBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  typeBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  address: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  priceItem: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  priceLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  priceValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  foodInfo: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.secondaryLight,
    borderRadius: BORDER_RADIUS.md,
  },
  foodText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.secondaryDark,
    fontWeight: '500',
  },
  roomCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  roomDetails: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  roomPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  amenityChip: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  amenityChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  safetyChip: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  safetyChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.secondaryDark,
    fontWeight: '500',
  },
  noSafety: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  ruleLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  ruleValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.md,
  },
  contactButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  sosButton: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  sosButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  // Modal styles
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
    marginBottom: SPACING.md,
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
  modalSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
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
  // Image Modal
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'black',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: SPACING.lg,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseText: {
    color: 'white',
    fontSize: FONT_SIZES.xl,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  imageModalCounter: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  imageModalCounterText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});