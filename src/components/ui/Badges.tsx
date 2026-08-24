import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  SHADOWS,
} from "../../constants";

// Verified Owner Badge
export function VerifiedOwnerBadge({
  size = "md",
  onPress,
}: {
  size?: "sm" | "md" | "lg";
  onPress?: () => void;
}) {
  const sizeStyles = {
    sm: {
      icon: 12,
      text: FONT_SIZES.xs,
      paddingH: SPACING.xs,
      paddingV: SPACING.xxs,
      radius: BORDER_RADIUS.round,
    },
    md: {
      icon: 16,
      text: FONT_SIZES.sm,
      paddingH: SPACING.sm,
      paddingV: SPACING.xs,
      radius: BORDER_RADIUS.round,
    },
    lg: {
      icon: 20,
      text: FONT_SIZES.md,
      paddingH: SPACING.md,
      paddingV: SPACING.sm,
      radius: BORDER_RADIUS.round,
    },
  }[size];

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        styles.badge,
        { borderRadius: sizeStyles.radius },
        onPress && {
          paddingHorizontal: sizeStyles.paddingH,
          paddingVertical: sizeStyles.paddingV,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.badgeInner}>
        <Text style={[styles.badgeIcon, { fontSize: sizeStyles.icon }]}>✓</Text>
        <Text style={[styles.badgeText, { fontSize: sizeStyles.text }]}>
          Verified Owner
        </Text>
      </View>
    </Component>
  );
}

// Verified PG Badge
export function VerifiedPGBadge({
  size = "md",
  onPress,
}: {
  size?: "sm" | "md" | "lg";
  onPress?: () => void;
}) {
  const sizeStyles = {
    sm: {
      icon: 12,
      text: FONT_SIZES.xs,
      paddingH: SPACING.xs,
      paddingV: SPACING.xxs,
      radius: BORDER_RADIUS.round,
    },
    md: {
      icon: 16,
      text: FONT_SIZES.sm,
      paddingH: SPACING.sm,
      paddingV: SPACING.xs,
      radius: BORDER_RADIUS.round,
    },
    lg: {
      icon: 20,
      text: FONT_SIZES.md,
      paddingH: SPACING.md,
      paddingV: SPACING.sm,
      radius: BORDER_RADIUS.round,
    },
  }[size];

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.badge, { borderRadius: sizeStyles.radius }]}
      onPress={onPress}
    >
      <View style={styles.badgeInner}>
        <Text style={[styles.badgeIcon, { fontSize: sizeStyles.icon }]}>
          🛡️
        </Text>
        <Text style={[styles.badgeText, { fontSize: sizeStyles.text }]}>
          Verified PG
        </Text>
      </View>
    </Component>
  );
}

// Safety Score Badge
export function SafetyScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeStyles = {
    sm: { width: 40, height: 40, fontSize: FONT_SIZES.sm, borderWidth: 2 },
    md: { width: 56, height: 56, fontSize: FONT_SIZES.lg, borderWidth: 3 },
    lg: { width: 72, height: 72, fontSize: FONT_SIZES.xxxl, borderWidth: 4 },
  }[size];

  const getScoreColor = (s: number) => {
    if (s >= 80) return COLORS.secondary;
    if (s >= 60) return COLORS.warning;
    if (s >= 40) return COLORS.accent;
    return COLORS.error;
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Very Safe";
    if (s >= 60) return "Safe";
    if (s >= 40) return "Caution";
    return "Unsafe";
  };

  const scoreColor = getScoreColor(score);

  return (
    <View style={styles.scoreBadge}>
      <View
        style={[
          styles.scoreCircle,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            borderWidth: sizeStyles.borderWidth,
            borderColor: scoreColor,
          },
        ]}
      >
        <Text
          style={[
            styles.scoreNumber,
            { fontSize: sizeStyles.fontSize, color: scoreColor },
          ]}
        >
          {score}
        </Text>
      </View>
      <Text style={[styles.scoreLabel, { color: scoreColor }]}>
        {getScoreLabel(score)}
      </Text>
    </View>
  );
}

// Girls Only Badge
export function GirlsOnlyBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeStyles = {
    sm: {
      icon: 12,
      text: FONT_SIZES.xs,
      paddingH: SPACING.xs,
      paddingV: SPACING.xxs,
      radius: BORDER_RADIUS.round,
    },
    md: {
      icon: 16,
      text: FONT_SIZES.sm,
      paddingH: SPACING.sm,
      paddingV: SPACING.xs,
      radius: BORDER_RADIUS.round,
    },
    lg: {
      icon: 20,
      text: FONT_SIZES.md,
      paddingH: SPACING.md,
      paddingV: SPACING.sm,
      radius: BORDER_RADIUS.round,
    },
  }[size];

  return (
    <View style={[styles.badgePink, { borderRadius: sizeStyles.radius }]}>
      <View style={styles.badgeInner}>
        <Text style={[styles.badgeIcon, { fontSize: sizeStyles.icon }]}>
          👩
        </Text>
        <Text style={[styles.badgeTextPink, { fontSize: sizeStyles.text }]}>
          Girls Only
        </Text>
      </View>
    </View>
  );
}

// Safety Feature Icons Row
export function SafetyFeaturesRow({
  features,
  maxVisible = 4,
}: {
  features: string[];
  maxVisible?: number;
}) {
  const SAFETY_ICONS: Record<string, string> = {
    cctv: "📹",
    "security-guard": "🛡️",
    "biometric-entry": "🔐",
    "fire-extinguisher": "🧯",
    "fire-alarm": "🔔",
    "emergency-exit": "🚪",
    "female-warden": "👩‍💼",
    "police-verified": "👮",
  };

  const SAFETY_LABELS: Record<string, string> = {
    cctv: "CCTV",
    "security-guard": "Security Guard",
    "biometric-entry": "Biometric Entry",
    "fire-extinguisher": "Fire Extinguisher",
    "fire-alarm": "Fire Alarm",
    "emergency-exit": "Emergency Exit",
    "female-warden": "Female Warden",
    "police-verified": "Police Verified",
  };

  const visibleFeatures = features.slice(0, maxVisible);
  const remainingCount = features.length - maxVisible;

  return (
    <View style={styles.featuresRow}>
      {visibleFeatures.map((feature, index) => (
        <View key={index} style={styles.featureChip}>
          <Text style={styles.featureIcon}>{SAFETY_ICONS[feature] || "✓"}</Text>
          <Text style={styles.featureLabel}>
            {SAFETY_LABELS[feature] || feature}
          </Text>
        </View>
      ))}
      {remainingCount > 0 && (
        <View style={styles.featureChipMore}>
          <Text style={styles.featureMoreText}>+{remainingCount} more</Text>
        </View>
      )}
    </View>
  );
}

// Amenity Chip
export function AmenityChip({
  amenity,
  selected,
  onPress,
  disabled,
}: {
  amenity: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const AMENITY_ICONS: Record<string, string> = {
    wifi: "📶",
    ac: "❄️",
    food: "🍽️",
    laundry: "🧺",
    cctv: "📹",
    security: "🛡️",
    parking: "🅿️",
    gym: "💪",
    refrigerator: "🧊",
    geyser: "🚿",
    "power-backup": "🔌",
    "water-purifier": "💧",
    tv: "📺",
    "attached-bathroom": "🚿",
    balcony: "🌿",
    "study-table": "📚",
    wardrobe: "👗",
    bed: "🛏️",
    mattress: "🛏️",
  };

  const AMENITY_LABELS: Record<string, string> = {
    wifi: "WiFi",
    ac: "AC",
    food: "Food",
    laundry: "Laundry",
    cctv: "CCTV",
    security: "Security",
    parking: "Parking",
    gym: "Gym",
    refrigerator: "Fridge",
    geyser: "Geyser",
    "power-backup": "Power Backup",
    "water-purifier": "Water Purifier",
    tv: "TV",
    "attached-bathroom": "Attached Bath",
    balcony: "Balcony",
    "study-table": "Study Table",
    wardrobe: "Wardrobe",
    bed: "Bed",
    mattress: "Mattress",
  };

  return (
    <TouchableOpacity
      style={[
        styles.amenityChip,
        selected && styles.amenityChipSelected,
        disabled && styles.amenityChipDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.amenityIcon}>{AMENITY_ICONS[amenity] || "✓"}</Text>
      <Text
        style={[styles.amenityLabel, selected && styles.amenityLabelSelected]}
      >
        {AMENITY_LABELS[amenity] || amenity}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.secondaryLight,
    borderWidth: 1,
    borderColor: COLORS.secondary + "40",
    flexDirection: "row",
    alignItems: "center",
  },
  badgePink: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
    flexDirection: "row",
    alignItems: "center",
  },
  badgeInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  badgeIcon: {
    fontWeight: "700",
  },
  badgeText: {
    fontWeight: "600",
    color: COLORS.secondaryDark,
  },
  badgeTextPink: {
    fontWeight: "600",
    color: COLORS.primaryDark,
  },
  scoreBadge: {
    alignItems: "center",
    gap: SPACING.xs,
  },
  scoreCircle: {
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreNumber: {
    fontWeight: "800",
  },
  scoreLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
  },
  featuresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  featureChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  featureIcon: {
    fontSize: FONT_SIZES.sm,
  },
  featureLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  featureChipMore: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  featureMoreText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  amenityChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  amenityChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  amenityChipDisabled: {
    opacity: 0.5,
  },
  amenityIcon: {
    fontSize: FONT_SIZES.md,
  },
  amenityLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  amenityLabelSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
