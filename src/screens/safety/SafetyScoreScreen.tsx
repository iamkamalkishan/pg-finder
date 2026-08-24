import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '../../constants';
import { SafetyScoreBadge, SafetyFeaturesRow, GirlsOnlyBadge, VerifiedPGBadge } from '../../components/ui/Badges';

interface SafetyScoreScreenProps {
  route: {
    params: {
      pgId: string;
      pgTitle: string;
      pgData?: any;
    };
  };
  navigation: any;
}

export function SafetyScoreScreen({ route, navigation }: SafetyScoreScreenProps) {
  const { pgId, pgTitle, pgData } = route.params;
  const [scoreData, setScoreData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadSafetyData();
  }, [pgId]);

  const loadSafetyData = async () => {
    // In production, this would call a cloud function to calculate safety score
    // For now, we'll compute from pgData and simulate
    setTimeout(() => {
      if (pgData) {
        const baseScore = 50;
        let score = baseScore;
        const factors: any[] = [];

        // Safety features
        const safetyFeatures = pgData.safetyFeatures || [];
        if (safetyFeatures.includes('cctv')) { score += 10; factors.push({ name: 'CCTV Cameras', impact: '+10', icon: '📹' }); }
        if (safetyFeatures.includes('security-guard')) { score += 10; factors.push({ name: 'Security Guard', impact: '+10', icon: '🛡️' }); }
        if (safetyFeatures.includes('biometric-entry')) { score += 8; factors.push({ name: 'Biometric Entry', impact: '+8', icon: '🔐' }); }
        if (safetyFeatures.includes('fire-extinguisher')) { score += 5; factors.push({ name: 'Fire Extinguisher', impact: '+5', icon: '🧯' }); }
        if (safetyFeatures.includes('fire-alarm')) { score += 5; factors.push({ name: 'Fire Alarm', impact: '+5', icon: '🔔' }); }
        if (safetyFeatures.includes('emergency-exit')) { score += 5; factors.push({ name: 'Emergency Exit', impact: '+5', icon: '🚪' }); }
        if (safetyFeatures.includes('female-warden')) { score += 10; factors.push({ name: 'Female Warden', impact: '+10', icon: '👩‍💼' }); }
        if (safetyFeatures.includes('police-verified')) { score += 15; factors.push({ name: 'Police Verified', impact: '+15', icon: '👮' }); }

        // Verification status
        if (pgData.verification?.status === 'verified') { score += 10; factors.push({ name: 'PG Verified', impact: '+10', icon: '✅' }); }

        // Property type
        if (pgData.propertyType === 'girls-only') { score += 10; factors.push({ name: 'Girls Only', impact: '+10', icon: '👩' }); }

        // Rules
        if (pgData.rules?.curfewTime) { score += 5; factors.push({ name: 'Curfew Time', impact: '+5', icon: '🕘' }); }
        if (pgData.rules?.guestPolicy === 'none') { score += 5; factors.push({ name: 'No Guests Allowed', impact: '+5', icon: '🚫' }); }

        // Reviews
        if (pgData.stats?.avgRating >= 4) { score += 5; factors.push({ name: 'High Ratings', impact: '+5', icon: '⭐' }); }

        // Cap at 100
        score = Math.min(100, score);

        setScoreData({
          score,
          factors,
          breakdown: {
            security: safetyFeatures.filter((f: string) => ['cctv', 'security-guard', 'biometric-entry'].includes(f)).length * 10,
            fire: safetyFeatures.filter((f: string) => ['fire-extinguisher', 'fire-alarm', 'emergency-exit'].includes(f)).length * 5,
            management: (safetyFeatures.includes('female-warden') ? 10 : 0) + (pgData.verification?.status === 'verified' ? 10 : 0),
            policies: (pgData.propertyType === 'girls-only' ? 10 : 0) + (pgData.rules?.curfewTime ? 5 : 0) + (pgData.rules?.guestPolicy === 'none' ? 5 : 0),
          },
        });
      }
      setLoading(false);
    }, 500);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Analyzing safety...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!scoreData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Could not calculate safety score</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { score, factors, breakdown } = scoreData;
  const scoreColor = score >= 80 ? COLORS.secondary : score >= 60 ? COLORS.warning : score >= 40 ? COLORS.accent : COLORS.error;
  const scoreLabel = score >= 80 ? 'Very Safe' : score >= 60 ? 'Safe' : score >= 40 ? 'Caution' : 'Unsafe';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safety Score</Text>
        </View>

        {/* PG Title */}
        <View style={styles.pgTitleCard}>
          <Text style={styles.pgTitleText}>{pgTitle}</Text>
          <Text style={styles.pgTitleSubtitle}>Comprehensive safety analysis</Text>
        </View>

        {/* Main Score */}
        <View style={styles.mainScoreCard}>
          <View style={styles.mainScoreHeader}>
            <Text style={styles.mainScoreLabel}>Overall Safety Score</Text>
            {pgData?.verification?.status === 'verified' && <VerifiedPGBadge size="sm" />}
          </View>
          
          <View style={styles.mainScoreDisplay}>
            <View style={[
              styles.mainScoreCircle,
              { borderColor: scoreColor, borderWidth: 6 },
            ]}>
              <Text style={[
                styles.mainScoreNumber,
                { color: scoreColor },
              ]}>
                {score}
              </Text>
            </View>
            
            <View style={styles.mainScoreInfo}>
              <Text style={[
                styles.mainScoreLabelLarge,
                { color: scoreColor },
              ]}>
                {scoreLabel}
              </Text>
              <Text style={styles.mainScoreDesc}>
                {score >= 80 ? 'Excellent safety measures in place' :
                 score >= 60 ? 'Good safety with room for improvement' :
                 score >= 40 ? 'Basic safety - review carefully before booking' :
                 'Significant safety concerns identified'}
              </Text>
            </View>
          </View>

          {/* Quick Badges */}
          <View style={styles.quickBadges}>
            {pgData?.propertyType === 'girls-only' && <GirlsOnlyBadge size="sm" />}
            {pgData?.verification?.status === 'verified' && <VerifiedPGBadge size="sm" />}
            {pgData?.safetyFeatures?.includes('police-verified') && (
              <View style={styles.policeVerifiedBadge}>
                <Text style={styles.policeVerifiedText}>👮 Police Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          
          <View style={styles.breakdownGrid}>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownCardHeader}>
                <Text style={styles.breakdownCardIcon}>🛡️</Text>
                <Text style={styles.breakdownCardTitle}>Security</Text>
              </View>
              <Text style={styles.breakdownCardValue}>{breakdown.security}/30</Text>
              <View style={styles.breakdownBar}>
                <View style={[
                  styles.breakdownBarFill,
                  { width: `${(breakdown.security / 30) * 100}%` },
                ]} />
              </View>
            </View>

            <View style={styles.breakdownCard}>
              <View style={styles.breakdownCardHeader}>
                <Text style={styles.breakdownCardIcon}>🔥</Text>
                <Text style={styles.breakdownCardTitle}>Fire Safety</Text>
              </View>
              <Text style={styles.breakdownCardValue}>{breakdown.fire}/15</Text>
              <View style={styles.breakdownBar}>
                <View style={[
                  styles.breakdownBarFill,
                  { width: `${(breakdown.fire / 15) * 100}%` },
                ]} />
              </View>
            </View>

            <View style={styles.breakdownCard}>
              <View style={styles.breakdownCardHeader}>
                <Text style={styles.breakdownCardIcon}>👥</Text>
                <Text style={styles.breakdownCardTitle}>Management</Text>
              </View>
              <Text style={styles.breakdownCardValue}>{breakdown.management}/20</Text>
              <View style={styles.breakdownBar}>
                <View style={[
                  styles.breakdownBarFill,
                  { width: `${(breakdown.management / 20) * 100}%` },
                ]} />
              </View>
            </View>

            <View style={styles.breakdownCard}>
              <View style={styles.breakdownCardHeader}>
                <Text style={styles.breakdownCardIcon}>📋</Text>
                <Text style={styles.breakdownCardTitle}>Policies</Text>
              </View>
              <Text style={styles.breakdownCardValue}>{breakdown.policies}/20</Text>
              <View style={styles.breakdownBar}>
                <View style={[
                  styles.breakdownBarFill,
                  { width: `${(breakdown.policies / 20) * 100}%` },
                ]} />
              </View>
            </View>
          </View>
        </View>

        {/* Positive Factors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Positive Safety Factors</Text>
          {factors.length > 0 ? (
            factors.map((factor, index) => (
              <View key={index} style={styles.factorCard}>
                <Text style={styles.factorIcon}>{factor.icon}</Text>
                <View style={styles.factorContent}>
                  <Text style={styles.factorName}>{factor.name}</Text>
                  <Text style={styles.factorImpact}>{factor.impact}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noFactors}>
              <Text style={styles.noFactorsText}>No significant safety features detected</Text>
            </View>
          )}
        </View>

        {/* Safety Features Detail */}
        {pgData?.safetyFeatures && pgData.safetyFeatures.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛡️ Safety Features</Text>
            <SafetyFeaturesRow features={pgData.safetyFeatures} maxVisible={8} />
          </View>
        )}

        {/* Rules */}
        {pgData?.rules && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 House Rules</Text>
            <View style={styles.rulesList}>
              {pgData.rules.curfewTime && (
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleIcon}>🕘</Text>
                  <Text style={styles.ruleText}>Curfew: {pgData.rules.curfewTime}</Text>
                </View>
              )}
              {pgData.rules.guestPolicy && (
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleIcon}>👥</Text>
                  <Text style={styles.ruleText}>
                    Guest Policy: {pgData.rules.guestPolicy === 'none' ? 'No guests' : 
                      pgData.rules.guestPolicy === 'day-only' ? 'Day visitors only' : 'Overnight allowed'}
                  </Text>
                </View>
              )}
              {pgData.rules.visitorHours && (
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleIcon}>🕐</Text>
                  <Text style={styles.ruleText}>Visitor Hours: {pgData.rules.visitorHours}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Recommendations</Text>
          <View style={styles.recommendationsList}>
            {score < 100 && (
              <>
                {!pgData?.safetyFeatures?.includes('cctv') && (
                  <View style={styles.recommendationCard}>
                    <Text style={styles.recommendationIcon}>📹</Text>
                    <View>
                      <Text style={styles.recommendationTitle}>Install CCTV Cameras</Text>
                      <Text style={styles.recommendationText}>
                        CCTV in common areas deters incidents and provides evidence if needed
                      </Text>
                    </View>
                  </View>
                )}
                {!pgData?.safetyFeatures?.includes('security-guard') && (
                  <View style={styles.recommendationCard}>
                    <Text style={styles.recommendationIcon}>🛡️</Text>
                    <View>
                      <Text style={styles.recommendationTitle}>Hire Security Guard</Text>
                      <Text style={styles.recommendationText}>
                        24/7 security presence significantly improves safety perception
                      </Text>
                    </View>
                  </View>
                )}
                {!pgData?.safetyFeatures?.includes('biometric-entry') && (
                  <View style={styles.recommendationCard}>
                    <Text style={styles.recommendationIcon}>🔐</Text>
                    <View>
                      <Text style={styles.recommendationTitle}>Add Biometric Entry</Text>
                      <Text style={styles.recommendationText}>
                        Prevents unauthorized access to the premises
                      </Text>
                    </View>
                  </View>
                )}
                {!pgData?.safetyFeatures?.includes('female-warden') && (
                  <View style={styles.recommendationCard}>
                    <Text style={styles.recommendationIcon}>👩‍💼</Text>
                    <View>
                      <Text style={styles.recommendationTitle}>Appoint Female Warden</Text>
                      <Text style={styles.recommendationText}>
                        Girls feel safer with female staff for emergencies
                      </Text>
                    </View>
                  </View>
                )}
                {!pgData?.verification?.status === 'verified' && (
                  <View style={styles.recommendationCard}>
                    <Text style={styles.recommendationIcon}>✅</Text>
                    <View>
                      <Text style={styles.recommendationTitle}>Get PG Verified</Text>
                      <Text style={styles.recommendationText}>
                        Verified PGs get 3x more enquiries and higher trust
                      </Text>
                    </View>
                  </View>
                )}
                {score >= 80 && (
                  <View style={styles.recommendationCardGood}>
                    <Text style={styles.recommendationIcon}>🎉</Text>
                    <View>
                      <Text style={styles.recommendationTitle}>Excellent Safety!</Text>
                      <Text style={styles.recommendationText}>
                        This PG has strong safety measures. Consider highlighting these in marketing.
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>⚠️ Important</Text>
          <Text style={styles.disclaimerText}>
            This safety score is based on self-reported data from the PG owner and publicly available information. 
            Always visit the PG personally, talk to current residents, and trust your instincts before making a decision. 
            PG Finder does not guarantee safety and is not liable for any incidents.
          </Text>
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
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
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
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  mainScoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  mainScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  mainScoreLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  mainScoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  mainScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainScoreNumber: {
    fontSize: 36,
    fontWeight: '800',
  },
  mainScoreInfo: {
    flex: 1,
  },
  mainScoreLabelLarge: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  mainScoreDesc: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  quickBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  policeVerifiedBadge: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  policeVerifiedText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.secondaryDark,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  breakdownCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  breakdownCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  breakdownCardIcon: {
    fontSize: FONT_SIZES.lg,
  },
  breakdownCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  breakdownCardValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  breakdownBar: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  factorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  factorIcon: {
    fontSize: FONT_SIZES.lg,
  },
  factorContent: {
    flex: 1,
  },
  factorName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  factorImpact: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  noFactors: {
    padding: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  noFactorsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textDisabled,
  },
  rulesList: {
    gap: SPACING.sm,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  ruleIcon: {
    fontSize: FONT_SIZES.md,
  },
  ruleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  recommendationsList: {
    gap: SPACING.sm,
  },
  recommendationCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: COLORS.accent + '10',
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  recommendationCardGood: {
    backgroundColor: COLORS.secondaryLight,
    borderColor: COLORS.secondary + '30',
  },
  recommendationIcon: {
    fontSize: FONT_SIZES.lg,
    marginTop: SPACING.xs,
  },
  recommendationTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  recommendationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  disclaimer: {
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  disclaimerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  disclaimerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});