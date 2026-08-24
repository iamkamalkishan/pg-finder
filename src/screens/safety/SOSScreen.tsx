import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '../../constants';
import { createSafetyAlert, getSafetyScoreForArea } from '../../services/firestore';
import * as Location from 'expo-location';

export function SOSScreen({ navigation }: any) {
  const { user } = useAuth();
  const [sending, setSending] = React.useState(false);
  const [countdown, setCountdown] = React.useState(3);
  const [showCountdown, setShowCountdown] = React.useState(false);
  const [location, setLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }
      
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      setLocationError('Could not get location');
    }
  };

  const handleSOSPress = () => {
    setShowCountdown(true);
    setCountdown(3);
    
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          triggerSOS();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const triggerSOS = async () => {
    if (!user || !location) {
      Alert.alert('Error', 'Cannot send SOS - missing location or user');
      setShowCountdown(false);
      return;
    }

    setSending(true);
    try {
      await createSafetyAlert({
        girlId: user.uid,
        location: { latitude: location.latitude, longitude: location.longitude },
        type: 'sos',
        message: 'Emergency SOS triggered from PG Finder app',
      });
      
      Alert.alert(
        'SOS Sent! 🚨',
        'Emergency contacts & admins have been notified with your location.\n\nStay safe! Help is on the way.',
        [{ text: 'OK', onPress: () => setShowCountdown(false) }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send SOS. Try again.');
    } finally {
      setSending(false);
      setShowCountdown(false);
    }
  };

  const cancelCountdown = () => {
    setShowCountdown(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SOS Button */}
        <View style={styles.sosSection}>
          {showCountdown ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownTitle}>SOS in {countdown}...</Text>
              <Text style={styles.countdownSubtitle}>Release to cancel</Text>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelCountdown}>
                <Text style={styles.cancelButtonText}>Cancel SOS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.sosButton} 
              onPress={handleSOSPress}
              disabled={sending}
              activeOpacity={0.9}
            >
              <View style={styles.sosButtonInner}>
                <Text style={styles.sosIcon}>🚨</Text>
                <Text style={styles.sosText}>SOS</Text>
                <Text style={styles.sosSubtext}>Emergency Alert</Text>
              </View>
              <View style={styles.sosPulse} />
            </TouchableOpacity>
          )}
          
          {sending && (
            <View style={styles.sendingOverlay}>
              <ActivityIndicator size="large" color={COLORS.surface} />
              <Text style={styles.sendingText}>Sending SOS...</Text>
            </View>
          )}
        </View>

        {/* Safety Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How SOS Works</Text>
          <View style={styles.infoSteps}>
            {[
              { icon: '1️⃣', title: 'Press & Hold', desc: 'Hold the SOS button for 3 seconds' },
              { icon: '2️⃣', title: 'Location Shared', desc: 'Your GPS location sent automatically' },
              { icon: '3️⃣', title: 'Alerts Sent', desc: 'Emergency contacts + admins notified' },
              { icon: '4️⃣', title: 'Help Arrives', desc: 'Nearest help directed to your location' },
            ].map((step, i) => (
              <View key={i} style={styles.infoStep}>
                <Text style={styles.infoStepIcon}>{step.icon}</Text>
                <View>
                  <Text style={styles.infoStepTitle}>{step.title}</Text>
                  <Text style={styles.infoStepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Your Emergency Contacts</Text>
          {user?.emergencyContact ? (
            <View style={styles.contactCard}>
              <Text style={styles.contactName}>{user.emergencyContact.name}</Text>
              <Text style={styles.contactPhone}>{user.emergencyContact.phone}</Text>
              <Text style={styles.contactLabel}>Will receive SOS alert with your location</Text>
            </View>
          ) : (
            <View style={styles.noContact}>
              <Text style={styles.noContactText}>No emergency contact set</Text>
              <Text style={styles.noContactSub}>Add one in Profile for faster help</Text>
            </View>
          )}
        </View>

        {/* Safety Score for Current Area */}
        {location && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Area Safety Score</Text>
            <SafetyScoreDisplay location={location} />
          </View>
        )}

        {/* Safety Tips */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Safety Tips</Text>
          <View style={styles.tipsList}>
            {[
              'Share live location with trusted contacts when visiting new PGs',
              'Always visit PGs during daytime, preferably with someone',
              'Verify owner documents before paying any deposit',
              'Check reviews from other girls on the app',
              'Keep emergency numbers saved in your phone',
              'Trust your instincts - if something feels wrong, leave',
            ].map((tip, i) => (
              <View key={i} style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => Alert.alert('Coming Soon', 'Nearby police stations feature coming soon')}>
            <Text style={styles.quickActionIcon}>🏢</Text>
            <Text style={styles.quickActionLabel}>Police Stations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => Alert.alert('Coming Soon', 'Nearby hospitals feature coming soon')}>
            <Text style={styles.quickActionIcon}>🏥</Text>
            <Text style={styles.quickActionLabel}>Hospitals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => Alert.alert('Coming Soon', 'Safe route navigation coming soon')}>
            <Text style={styles.quickActionIcon}>🗺️</Text>
            <Text style={styles.quickActionLabel}>Safe Routes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => Alert.alert('Helpline Numbers', 'Police: 100\nWomen Helpline: 1091\nAmbulance: 108\nFire: 101')}>
            <Text style={styles.quickActionIcon}>📞</Text>
            <Text style={styles.quickActionLabel}>Helplines</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SafetyScoreDisplay({ location }: { location: { latitude: number; longitude: number } }) {
  const [score, setScore] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchScore = async () => {
      try {
        const data = await getSafetyScoreForArea(location.latitude, location.longitude);
        setScore(data.score);
      } catch (error) {
        console.error('Error fetching safety score:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchScore();
  }, [location]);

  if (loading) {
    return (
      <View style={styles.scoreLoading}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.scoreLoadingText}>Calculating safety score...</Text>
      </View>
    );
  }

  if (score === null) {
    return (
      <View style={styles.scoreUnavailable}>
        <Text style={styles.scoreUnavailableText}>Safety score unavailable for this area</Text>
      </View>
    );
  }

  const getScoreColor = (s: number) => {
    if (s >= 80) return COLORS.secondary;
    if (s >= 60) return COLORS.warning;
    if (s >= 40) return COLORS.accent;
    return COLORS.error;
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Very Safe';
    if (s >= 60) return 'Safe';
    if (s >= 40) return 'Caution';
    return 'Unsafe';
  };

  const scoreColor = getScoreColor(score);

  return (
    <View style={styles.scoreContainer}>
      <View style={[
        styles.scoreCircle,
        { borderColor: scoreColor },
      ]}>
        <Text style={[
          styles.scoreNumber,
          { color: scoreColor },
        ]}>
          {score}
        </Text>
      </View>
      <View style={styles.scoreInfo}>
        <Text style={[
          styles.scoreLabel,
          { color: scoreColor },
        ]}>
          {getScoreLabel(score)}
        </Text>
        <Text style={styles.scoreDesc}>
          Based on crime data, lighting, police presence & community reports
        </Text>
        <TouchableOpacity style={styles.scoreDetailsButton}>
          <Text style={styles.scoreDetailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  sosSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
    position: 'relative',
  },
  sosButtonInner: {
    alignItems: 'center',
    zIndex: 2,
  },
  sosIcon: {
    fontSize: 48,
    marginBottom: SPACING.xs,
  },
  sosText: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: 4,
  },
  sosSubtext: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  sosPulse: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.error,
    zIndex: 1,
  },
  sendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  sendingText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  countdownContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  countdownTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: SPACING.xs,
  },
  countdownSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.lg,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  cancelButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoSteps: {
    gap: SPACING.md,
  },
  infoStep: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  infoStepIcon: {
    fontSize: FONT_SIZES.lg,
    marginTop: SPACING.xs,
  },
  infoStepTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  infoStepDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  contactCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  contactName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  contactPhone: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  contactLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  noContact: {
    padding: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  noContactText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  noContactSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textDisabled,
    marginTop: SPACING.xs,
  },
  scoreContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '800',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  scoreDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  scoreDetailsButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    alignSelf: 'flex-start',
  },
  scoreDetailsButtonText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scoreLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scoreLoadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  scoreUnavailable: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  scoreUnavailableText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textDisabled,
  },
  tipsList: {
    gap: SPACING.sm,
  },
  tipItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tipBullet: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  tipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});