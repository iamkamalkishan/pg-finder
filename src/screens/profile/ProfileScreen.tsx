import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '../../constants';
import { User } from '../../types';
import { updateUserProfile, signOutUser } from '../../services/auth';
import { uploadUserAvatar } from '../../services/storage';
import * as ImagePicker from 'expo-image-picker';

export function ProfileScreen({ navigation }: any) {
  const { user, updateProfile, signOut, loading: authLoading } = useAuth();
  const [editing, setEditing] = React.useState(false);
  const [editData, setEditData] = React.useState({
    name: '',
    email: '',
    college: '',
    workplace: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    businessName: '',
    gstNumber: '',
  });
  const [saving, setSaving] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        email: user.email || '',
        college: user.college || '',
        workplace: user.workplace || '',
        emergencyContactName: user.emergencyContact?.name || '',
        emergencyContactPhone: user.emergencyContact?.phone || '',
        businessName: user.businessName || '',
        gstNumber: user.gstNumber || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!editData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    
    setSaving(true);
    try {
      await updateProfile(editData);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (result.canceled || !result.assets[0]) return;
      
      setUploadingAvatar(true);
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      
      const avatarUrl = await uploadUserAvatar(user!.uid, blob);
      
      await updateProfile({ avatarUrl });
      Alert.alert('Success', 'Profile picture updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Please log in</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isGirl = user.role === 'girl';
  const isOwner = user.role === 'owner';

  return (
    <>
      <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.avatarEditButton} 
              onPress={handleAvatarPick}
              disabled={uploadingAvatar}
            >
              <Text style={styles.avatarEditText}>📷</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={[
              styles.roleBadgeText,
              isGirl && styles.roleBadgeGirl,
              isOwner && styles.roleBadgeOwner,
            ]}>
              {isGirl ? '👩 Looking for PG' : '🏢 PG Owner'}
            </Text>
          </View>
          
          {user.verificationStatus === 'pending' && (
            <View style={styles.verificationBanner}>
              <Text style={styles.verificationText}>⏳ Verification pending</Text>
            </View>
          )}
          {user.verificationStatus === 'verified' && isOwner && (
            <View style={styles.verificationBannerVerified}>
              <Text style={styles.verificationTextVerified}>✓ Verified Owner</Text>
            </View>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
          {user.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          )}
        </View>

        {/* Girl-specific fields */}
        {isGirl && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Education & Work</Text>
              {editing ? (
                <>
                  <TextInput
                    style={styles.editInput}
                    placeholder="College / University"
                    value={editData.college}
                    onChangeText={v => setEditData(prev => ({ ...prev, college: v }))}
                    autoCapitalize="words"
                  />
                  <TextInput
                    style={styles.editInput}
                    placeholder="Workplace"
                    value={editData.workplace}
                    onChangeText={v => setEditData(prev => ({ ...prev, workplace: v }))}
                    autoCapitalize="words"
                  />
                </>
              ) : (
                <>
                  {user.college && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>College</Text>
                      <Text style={styles.infoValue}>{user.college}</Text>
                    </View>
                  )}
                  {user.workplace && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Workplace</Text>
                      <Text style={styles.infoValue}>{user.workplace}</Text>
                    </View>
                  )}
                  {!user.college && !user.workplace && (
                    <Text style={styles.emptyInfo}>Not set</Text>
                  )}
                </>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Emergency Contact (Safety)</Text>
              {editing ? (
                <>
                  <TextInput
                    style={styles.editInput}
                    placeholder="Contact Name"
                    value={editData.emergencyContactName}
                    onChangeText={v => setEditData(prev => ({ ...prev, emergencyContactName: v }))}
                    autoCapitalize="words"
                  />
                  <TextInput
                    style={styles.editInput}
                    placeholder="Contact Phone"
                    value={editData.emergencyContactPhone}
                    onChangeText={v => setEditData(prev => ({ ...prev, emergencyContactPhone: v }))}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </>
              ) : (
                user.emergencyContact ? (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Name</Text>
                      <Text style={styles.infoValue}>{user.emergencyContact.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Phone</Text>
                      <Text style={styles.infoValue}>{user.emergencyContact.phone}</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.emptyInfo}>Not set - Required for safety features</Text>
                )
              )}
            </View>
          </>
        )}

        {/* Owner-specific fields */}
        {isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Details</Text>
            {editing ? (
              <>
                <TextInput
                  style={styles.editInput}
                  placeholder="Business / PG Name"
                  value={editData.businessName}
                  onChangeText={v => setEditData(prev => ({ ...prev, businessName: v }))}
                  autoCapitalize="words"
                />
                <TextInput
                  style={styles.editInput}
                  placeholder="GST Number (optional)"
                  value={editData.gstNumber}
                  onChangeText={v => setEditData(prev => ({ ...prev, gstNumber: v }))}
                  autoCapitalize="characters"
                />
              </>
            ) : (
              <>
                {user.businessName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Business Name</Text>
                    <Text style={styles.infoValue}>{user.businessName}</Text>
                  </View>
                )}
                {user.gstNumber && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>GST Number</Text>
                    <Text style={styles.infoValue}>{user.gstNumber}</Text>
                  </View>
                )}
                {!user.businessName && !user.gstNumber && (
                  <Text style={styles.emptyInfo}>Not set</Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Verification Status */}
        {isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verification Status</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[
                styles.statusBadge,
                user.verificationStatus === 'verified' && styles.statusVerified,
                user.verificationStatus === 'rejected' && styles.statusRejected,
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  user.verificationStatus === 'verified' && styles.statusTextVerified,
                  user.verificationStatus === 'rejected' && styles.statusTextRejected,
                ]}>
                  {user.verificationStatus === 'verified' ? '✓ Verified' : 
                   user.verificationStatus === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Edit/Save Buttons */}
        <View style={styles.buttonSection}>
          {editing ? (
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
              <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Coming Soon', 'Notifications settings coming soon')}>
            <Text style={styles.settingsLabel}>🔔 Notifications</Text>
            <Text style={styles.settingsChevron}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Coming Soon', 'Privacy settings coming soon')}>
            <Text style={styles.settingsLabel}>🔒 Privacy & Safety</Text>
            <Text style={styles.settingsChevron}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Coming Soon', 'Help & support coming soon')}>
            <Text style={styles.settingsLabel}>❓ Help & Support</Text>
            <Text style={styles.settingsChevron}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Coming Soon', 'About app coming soon')}>
            <Text style={styles.settingsLabel}>ℹ️ About</Text>
            <Text style={styles.settingsChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutModal(true)}>
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>PG Finder for Girls v1.0.0</Text>
      </ScrollView>
      </SafeAreaView>

      {/* Logout Modal */}
      <Modal visible={showLogoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalText}>Are you sure you want to logout?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleLogout}>
                <Text style={styles.modalConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    fontWeight: '600',
    color: COLORS.primary,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  avatarEditText: {
    fontSize: 14,
  },
  name: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  roleBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },
  roleBadgeGirl: {
    backgroundColor: COLORS.primaryLight,
  },
  roleBadgeOwner: {
    backgroundColor: COLORS.secondaryLight,
  },
  roleBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  roleBadgeGirlText: {
    color: COLORS.primary,
  },
  roleBadgeOwnerText: {
    color: COLORS.secondaryDark,
  },
  verificationBanner: {
    backgroundColor: COLORS.warning + '20',
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  verificationBannerVerified: {
    backgroundColor: COLORS.secondaryLight,
    borderColor: COLORS.secondary,
  },
  verificationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    fontWeight: '500',
  },
  verificationTextVerified: {
    color: COLORS.secondaryDark,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  emptyInfo: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textDisabled,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  editInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  statusBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  statusVerified: {
    backgroundColor: COLORS.secondaryLight,
  },
  statusRejected: {
    backgroundColor: COLORS.error + '20',
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  statusTextVerified: {
    color: COLORS.secondaryDark,
  },
  statusTextRejected: {
    color: COLORS.error,
  },
  buttonSection: {
    marginBottom: SPACING.lg,
  },
  editButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  editButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  settingsLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  settingsChevron: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textDisabled,
  },
  logoutButton: {
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  logoutButtonText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    color: COLORS.textDisabled,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xl,
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
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  modalText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
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
    backgroundColor: COLORS.error,
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