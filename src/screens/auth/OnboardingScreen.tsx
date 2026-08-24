import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  SHADOWS,
} from "../../constants";
import { UserRole } from "../../types";

export function OnboardingScreen({ navigation }: any) {
  const { completeProfile, user, loading, error, clearError } = useAuth();
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    name: "",
    role: "girl" as UserRole,
    email: "",
    college: "",
    workplace: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    businessName: "",
    gstNumber: "",
  });
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("girl");

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        Alert.alert("Error", "Please enter your name");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedRole) {
        Alert.alert("Error", "Please select your role");
        return;
      }
      setFormData((prev) => ({ ...prev, role: selectedRole }));
      setStep(3);
    } else if (step === 3) {
      if (selectedRole === "girl") {
        if (
          !formData.emergencyContactName.trim() ||
          !formData.emergencyContactPhone.trim()
        ) {
          Alert.alert("Error", "Emergency contact is required for safety");
          return;
        }
      } else if (selectedRole === "owner") {
        if (!formData.businessName.trim()) {
          Alert.alert("Error", "Business name is required");
          return;
        }
      }
      completeProfile(formData);
      navigation.reset({
        index: 0,
        routes: [{ name: user?.role === "owner" ? "OwnerTabs" : "GirlTabs" }],
      });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Setting up your profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.progressStep}>
              <View
                style={[
                  styles.progressCircle,
                  s < step && styles.progressCircleCompleted,
                  s === step && styles.progressCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.progressNumber,
                    s <= step && styles.progressNumberCompleted,
                  ]}
                >
                  {s <= step ? "✓" : s}
                </Text>
              </View>
              <Text
                style={[
                  styles.progressLabel,
                  s === step && styles.progressLabelActive,
                ]}
              >
                {s === 1 ? "Basic Info" : s === 2 ? "Role" : "Details"}
              </Text>
            </View>
          ))}
          <View style={styles.progressLine} />
          <View
            style={[
              styles.progressLineFill,
              { width: `${((step - 1) / 2) * 100}%` },
            ]}
          />
        </View>

        <View style={styles.card}>
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>Tell us about yourself</Text>
              <Text style={styles.stepSubtitle}>
                We'll personalize your experience
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formData.name}
                onChangeText={(v) => updateField("name", v)}
                autoCapitalize="words"
                autoFocus
              />

              <TextInput
                style={styles.input}
                placeholder="Email (optional)"
                value={formData.email}
                onChangeText={(v) => updateField("email", v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>How will you use the app?</Text>
              <Text style={styles.stepSubtitle}>Choose your role</Text>

              <View style={styles.roleOptions}>
                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    selectedRole === "girl" && styles.roleCardSelected,
                  ]}
                  onPress={() => setSelectedRole("girl")}
                >
                  <Text style={styles.roleIcon}>👩</Text>
                  <Text
                    style={[
                      styles.roleTitle,
                      selectedRole === "girl" && styles.roleTitleSelected,
                    ]}
                  >
                    I'm Looking for PG
                  </Text>
                  <Text
                    style={[
                      styles.roleDesc,
                      selectedRole === "girl" && styles.roleDescSelected,
                    ]}
                  >
                    Find safe, verified PGs\nChat with owners\nBook visits
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    selectedRole === "owner" && styles.roleCardSelected,
                  ]}
                  onPress={() => setSelectedRole("owner")}
                >
                  <Text style={styles.roleIcon}>🏢</Text>
                  <Text
                    style={[
                      styles.roleTitle,
                      selectedRole === "owner" && styles.roleTitleSelected,
                    ]}
                  >
                    I Own a PG
                  </Text>
                  <Text
                    style={[
                      styles.roleDesc,
                      selectedRole === "owner" && styles.roleDescSelected,
                    ]}
                  >
                    List your property\nManage enquiries\nEarn with zero
                    investment
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 3 && selectedRole === "girl" && (
            <View>
              <Text style={styles.stepTitle}>Safety First</Text>
              <Text style={styles.stepSubtitle}>
                Emergency contact (required for your safety)
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Emergency Contact Name"
                value={formData.emergencyContactName}
                onChangeText={(v) => updateField("emergencyContactName", v)}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="Emergency Contact Phone"
                value={formData.emergencyContactPhone}
                onChangeText={(v) => updateField("emergencyContactPhone", v)}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <TextInput
                style={styles.input}
                placeholder="College / University (optional)"
                value={formData.college}
                onChangeText={(v) => updateField("college", v)}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="Workplace (optional)"
                value={formData.workplace}
                onChangeText={(v) => updateField("workplace", v)}
                autoCapitalize="words"
              />
            </View>
          )}

          {step === 3 && selectedRole === "owner" && (
            <View>
              <Text style={styles.stepTitle}>Business Details</Text>
              <Text style={styles.stepSubtitle}>
                Help us verify your property
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Business / PG Name"
                value={formData.businessName}
                onChangeText={(v) => updateField("businessName", v)}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="GST Number (optional)"
                value={formData.gstNumber}
                onChangeText={(v) => updateField("gstNumber", v)}
                autoCapitalize="characters"
              />

              <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={formData.name}
                onChangeText={(v) => updateField("name", v)}
                autoCapitalize="words"
              />
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonRow}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleBack}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.primaryButton, { flex: step > 1 ? 1 : undefined }]}
              onPress={handleNext}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading
                  ? "Please wait..."
                  : step === 3
                    ? "Get Started"
                    : "Next"}
              </Text>
            </TouchableOpacity>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xl,
    position: "relative",
  },
  progressStep: {
    flex: 1,
    alignItems: "center",
    zIndex: 2,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  progressCircleCompleted: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  progressCircleActive: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  progressNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  progressNumberCompleted: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.lg,
  },
  progressLabel: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  progressLabelActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  progressLine: {
    position: "absolute",
    top: 20,
    left: "25%",
    right: "25%",
    height: 2,
    backgroundColor: COLORS.border,
    zIndex: 1,
  },
  progressLineFill: {
    position: "absolute",
    top: 20,
    left: "25%",
    height: 2,
    backgroundColor: COLORS.primary,
    zIndex: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  stepSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.md,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  roleOptions: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  roleCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
  },
  roleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  roleTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  roleTitleSelected: {
    color: COLORS.primary,
  },
  roleDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  roleDescSelected: {
    color: COLORS.primaryDark,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
  },
});
