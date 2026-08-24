import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  SHADOWS,
} from "../../constants";

export function PhoneAuthScreen({ navigation }: any) {
  const { sendOTP, verifyOTP, error, clearError, loading } = useAuth();
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpTimer, setOtpTimer] = React.useState(60);
  const [resendDisabled, setResendDisabled] = React.useState(false);

  React.useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const timer = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (otpTimer === 0) {
      setResendDisabled(false);
    }
  }, [otpTimer, otpSent]);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    try {
      await sendOTP(phone);
      setOtpSent(true);
      setOtpTimer(60);
      setResendDisabled(true);
      Alert.alert("Success", "OTP sent to " + phone);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit OTP");
      return;
    }

    try {
      await verifyOTP(otp);
      navigation.navigate("Onboarding");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleResendOTP = async () => {
    if (resendDisabled) return;
    await handleSendOTP();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🏠</Text>
          <Text style={styles.appTitle}>PG Finder for Girls</Text>
          <Text style={styles.appTagline}>Safe. Verified. Yours.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {otpSent ? "Enter OTP" : "Enter Phone Number"}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {otpSent
              ? `We've sent a 6-digit code to ${phone}`
              : "We'll send you a one-time password"}
          </Text>

          {!otpSent ? (
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor={COLORS.textDisabled}
              />
              {loading && (
                <ActivityIndicator
                  style={styles.loader}
                  color={COLORS.primary}
                />
              )}
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.otpInput}
                placeholder="OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor={COLORS.textDisabled}
                autoFocus
              />
              {loading && (
                <ActivityIndicator
                  style={styles.loader}
                  color={COLORS.primary}
                />
              )}
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={otpSent ? handleVerifyOTP : handleSendOTP}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Please wait..." : otpSent ? "Verify OTP" : "Send OTP"}
            </Text>
          </TouchableOpacity>

          {otpSent && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleResendOTP}
              disabled={resendDisabled}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  resendDisabled && styles.resendDisabledText,
                ]}
              >
                {resendDisabled ? `Resend OTP in ${otpTimer}s` : "Resend OTP"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{" "}
            <Text style={styles.linkText}>Terms of Service</Text> and{" "}
            <Text style={styles.linkText}>Privacy Policy</Text>
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
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  logoText: {
    fontSize: 80,
    marginBottom: SPACING.sm,
  },
  appTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  appTagline: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.lg,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
  },
  otpInput: {
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.xxl,
    letterSpacing: 8,
    textAlign: "center",
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
  },
  loader: {
    marginTop: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: SPACING.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: "500",
  },
  resendDisabledText: {
    color: COLORS.textDisabled,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: "center",
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: "500",
  },
});
