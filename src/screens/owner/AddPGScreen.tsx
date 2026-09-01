import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  SHADOWS,
  AMENITIES,
  SAFETY_FEATURES,
  PROPERTY_TYPES,
  SHARING_OPTIONS,
  GUEST_POLICIES,
  AMENITY_LABELS,
  SAFETY_FEATURE_LABELS,
  PROPERTY_TYPE_LABELS,
  GUEST_POLICY_LABELS,
  MAJOR_CITIES,
  INDIAN_STATES,
  MAX_PHOTOS_PER_PG,
} from "../../constants";
import { PG, PropertyType, GuestPolicy, RoomType } from "../../types";
import { createPG } from "../../services/firestore";
import { uploadPGPhotos, uploadPGDocuments } from "../../services/storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Picker } from "@react-native-picker/picker";

export function AddPGScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const [step, setStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    // Step 1: Basic Info
    title: "",
    description: "",
    propertyType: "girls-only" as PropertyType,

    // Step 2: Location
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",

    // Step 3: Rooms & Pricing
    roomTypes: [] as RoomType[],
    totalRooms: 0,
    availableRooms: 0,

    // Step 4: Amenities & Safety
    amenities: [] as string[],
    safetyFeatures: [] as string[],

    // Step 5: Rules
    curfewTime: "",
    guestPolicy: "day-only" as GuestPolicy,
    visitorHours: "",

    // Media
    photos: [] as { uri: string; name: string }[],
    documents: [] as { uri: string; name: string; type: string }[],
  });

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (arrayKey: string, item: string) => {
    setFormData((prev) => {
      const arr = prev[arrayKey as keyof typeof formData] as string[];
      const newArr = arr.includes(item)
        ? arr.filter((i) => i !== item)
        : [...arr, item];
      return { ...prev, [arrayKey]: newArr };
    });
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!formData.title.trim()) {
        Alert.alert("Error", "PG title is required");
        return false;
      }
      if (!formData.description.trim()) {
        Alert.alert("Error", "Description is required");
        return false;
      }
    }
    if (step === 2) {
      if (!formData.addressLine1.trim()) {
        Alert.alert("Error", "Address is required");
        return false;
      }
      if (!formData.city.trim()) {
        Alert.alert("Error", "City is required");
        return false;
      }
      if (!formData.state.trim()) {
        Alert.alert("Error", "State is required");
        return false;
      }
      if (!formData.pincode.trim() || formData.pincode.length !== 6) {
        Alert.alert("Error", "Valid 6-digit pincode required");
        return false;
      }
    }
    if (step === 3) {
      if (formData.roomTypes.length === 0) {
        Alert.alert("Error", "Add at least one room type");
        return false;
      }
    }
    if (step === 4) {
      if (formData.amenities.length === 0) {
        Alert.alert("Error", "Select at least one amenity");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < 5) setStep(step + 1);
      else handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  // Room type management
  const [showRoomModal, setShowRoomModal] = React.useState(false);
  const [editingRoomIndex, setEditingRoomIndex] = React.useState<number | null>(
    null,
  );
  const [roomForm, setRoomForm] = React.useState<Partial<RoomType>>({
    name: "",
    sharing: 2,
    count: 1,
    rent: 0,
    amenities: [],
  });

  const openRoomModal = (index?: number) => {
    if (index !== undefined) {
      setEditingRoomIndex(index);
      setRoomForm(formData.roomTypes[index]);
    } else {
      setEditingRoomIndex(null);
      setRoomForm({ name: "", sharing: 2, count: 1, rent: 0, amenities: [] });
    }
    setShowRoomModal(true);
  };

  const saveRoom = () => {
    if (!roomForm.name || !roomForm.rent || !roomForm.count) {
      Alert.alert("Error", "All fields required");
      return;
    }

    const room: RoomType = {
      id:
        editingRoomIndex !== null
          ? formData.roomTypes[editingRoomIndex].id
          : `room-${Date.now()}`,
      name: roomForm.name,
      sharing: roomForm.sharing as 1 | 2 | 3,
      count: roomForm.count,
      rent: roomForm.rent,
      amenities: roomForm.amenities || [],
    };

    setFormData((prev) => {
      const rooms = [...prev.roomTypes];
      if (editingRoomIndex !== null) {
        rooms[editingRoomIndex] = room;
      } else {
        rooms.push(room);
      }
      return {
        ...prev,
        roomTypes: rooms,
        totalRooms: rooms.reduce((sum, r) => sum + r.count, 0),
        availableRooms: rooms.reduce((sum, r) => sum + r.count, 0),
      };
    });

    setShowRoomModal(false);
  };

  const deleteRoom = (index: number) => {
    Alert.alert("Delete Room", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setFormData((prev) => {
            const rooms = prev.roomTypes.filter((_, i) => i !== index);
            return {
              ...prev,
              roomTypes: rooms,
              totalRooms: rooms.reduce((sum, r) => sum + r.count, 0),
              availableRooms: rooms.reduce((sum, r) => sum + r.count, 0),
            };
          });
        },
      },
    ]);
  };

  // Photo picking
  const pickPhotos = async () => {
    if (formData.photos.length >= MAX_PHOTOS_PER_PG) {
      Alert.alert("Error", `Maximum ${MAX_PHOTOS_PER_PG} photos allowed`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS_PER_PG - formData.photos.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map((asset) => ({
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
        }));
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...newPhotos],
        }));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick photos");
    }
  };

  const pickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) return;

      const assets = (result as any).assets || [result];
      const newDocs = assets.map((asset: any) => ({
        uri: asset.uri,
        name: asset.name || `doc_${Date.now()}.pdf`,
        type: asset.mimeType || "application/pdf",
      }));
      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, ...newDocs],
      }));
    } catch (error) {
      Alert.alert("Error", "Failed to pick documents");
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      // Create PG first (without media)
      const pgId = await createPG({
        ownerId: user.uid,
        title: formData.title,
        description: formData.description,
        propertyType: formData.propertyType,
        address: {
          line1: formData.addressLine1,
          line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          coordinates: { latitude: 0, longitude: 0 }, // Would use geocoding in production
        },
        totalRooms: formData.totalRooms,
        availableRooms: formData.availableRooms,
        roomTypes: formData.roomTypes,
        amenities: formData.amenities,
        safetyFeatures: formData.safetyFeatures,
        pricing: {
          sharing: formData.roomTypes[0]?.sharing || 2,
          rent: formData.roomTypes[0]?.rent || 0,
          deposit: formData.roomTypes[0]?.rent * 2 || 0, // 2 months deposit default
          foodIncluded: formData.amenities.includes("food"),
          foodCost: formData.amenities.includes("food") ? 3000 : undefined, // Default
        },
        photos: [], // Will be updated after upload
        videoTourUrl: undefined,
        verification: {
          status: "pending",
          documents: [],
        },
        rules: {
          curfewTime: formData.curfewTime || undefined,
          guestPolicy: formData.guestPolicy,
          visitorHours: formData.visitorHours || undefined,
        },
        status: "draft",
      });

      // Upload photos
      if (formData.photos.length > 0) {
        const photoFiles = await Promise.all(
          formData.photos.map(async (p) => {
            const response = await fetch(p.uri);
            const blob = await response.blob();
            return { file: blob, name: p.name };
          }),
        );
        const photoUrls = await uploadPGPhotos(pgId, photoFiles);

        // Update PG with photo URLs
        const { updatePG } = await import("../../services/firestore");
        await updatePG(pgId, { photos: photoUrls });
      }

      // Upload documents
      if (formData.documents.length > 0) {
        const docFiles = await Promise.all(
          formData.documents.map(async (d) => {
            const response = await fetch(d.uri);
            const blob = await response.blob();
            return { file: blob, name: d.name, contentType: d.type };
          }),
        );
        await uploadPGDocuments(pgId, docFiles);
      }

      Alert.alert(
        "Success!",
        "Your PG has been submitted for verification. We'll review it within 24-48 hours.",
      );
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit PG");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSubtitle}>Tell girls about your PG</Text>

      <TextInput
        style={styles.input}
        placeholder="PG Title (e.g., 'Safe Haven Girls PG - Koramangala')"
        value={formData.title}
        onChangeText={(v) => updateField("title", v)}
        autoCapitalize="words"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe your PG - facilities, location benefits, what makes it special..."
        value={formData.description}
        onChangeText={(v) => updateField("description", v)}
        multiline
        numberOfLines={5}
      />

      <Text style={styles.fieldLabel}>Property Type</Text>
      <Picker
        selectedValue={formData.propertyType}
        onValueChange={(v) => updateField("propertyType", v)}
        style={styles.picker}
        mode="dialog"
        itemStyle={styles.pickerItem}
      >
        {PROPERTY_TYPES.map((type) => (
          <Picker.Item key={type.value} label={type.label} value={type.value} />
        ))}
      </Picker>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Location</Text>
      <Text style={styles.stepSubtitle}>Where is your PG located?</Text>

      <TextInput
        style={styles.input}
        placeholder="Address Line 1 (Building name, street)"
        value={formData.addressLine1}
        onChangeText={(v) => updateField("addressLine1", v)}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Address Line 2 (Area, landmark - optional)"
        value={formData.addressLine2}
        onChangeText={(v) => updateField("addressLine2", v)}
        autoCapitalize="words"
      />

      <View style={styles.twoInputs}>
        <TextInput
          style={styles.input}
          placeholder="City"
          value={formData.city}
          onChangeText={(v) => updateField("city", v)}
          autoCapitalize="words"
        />
        <Picker
          selectedValue={formData.state}
          onValueChange={(v) => updateField("state", v)}
          style={styles.picker}
          mode="dialog"
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="Select State" value="" />
          {INDIAN_STATES.map((state) => (
            <Picker.Item key={state} label={state} value={state} />
          ))}
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Pincode (6 digits)"
        value={formData.pincode}
        onChangeText={(v) =>
          updateField("pincode", v.replace(/\D/g, "").slice(0, 6))
        }
        keyboardType="numeric"
        maxLength={6}
      />
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Rooms & Pricing</Text>
      <Text style={styles.stepSubtitle}>Add room types available</Text>

      {formData.roomTypes.length === 0 ? (
        <View style={styles.emptyRoomState}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={styles.emptyTitle}>No room types added</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => openRoomModal()}
          >
            <Text style={styles.primaryButtonText}>Add First Room Type</Text>
          </TouchableOpacity>
        </View>
      ) : (
        formData.roomTypes.map((room, index) => (
          <View key={index} style={styles.roomCard}>
            <View style={styles.roomCardInfo}>
              <Text style={styles.roomCardName}>{room.name}</Text>
              <Text style={styles.roomCardDetails}>
                {room.sharing} Sharing • {room.count} rooms • ₹
                {room.rent.toLocaleString()}/mo
              </Text>
            </View>
            <View style={styles.roomCardActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => openRoomModal(index)}
              >
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButtonDanger}
                onPress={() => deleteRoom(index)}
              >
                <Text>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.addRoomButton}
        onPress={() => openRoomModal()}
      >
        <Text style={styles.addRoomButtonText}>+ Add Another Room Type</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View>
      <Text style={styles.stepTitle}>Amenities</Text>
      <Text style={styles.stepSubtitle}>What facilities do you offer?</Text>
      <View style={styles.chipGrid}>
        {AMENITIES.map((amenity) => (
          <TouchableOpacity
            key={amenity}
            style={[
              styles.chip,
              formData.amenities.includes(amenity) && styles.chipActive,
            ]}
            onPress={() => toggleArrayItem("amenities", amenity)}
          >
            <Text
              style={[
                styles.chipText,
                formData.amenities.includes(amenity) && styles.chipTextActive,
              ]}
            >
              {AMENITY_LABELS[amenity]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionDivider} />

      <Text style={styles.stepTitle}>Safety Features</Text>
      <Text style={styles.stepSubtitle}>
        Safety is our top priority for girls
      </Text>
      <View style={styles.chipGrid}>
        {SAFETY_FEATURES.map((feature) => (
          <TouchableOpacity
            key={feature}
            style={[
              styles.chip,
              formData.safetyFeatures.includes(feature) && styles.chipActive,
            ]}
            onPress={() => toggleArrayItem("safetyFeatures", feature)}
          >
            <Text
              style={[
                styles.chipText,
                formData.safetyFeatures.includes(feature) &&
                  styles.chipTextActive,
              ]}
            >
              {SAFETY_FEATURE_LABELS[feature]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View>
      <Text style={styles.stepTitle}>House Rules</Text>
      <Text style={styles.stepSubtitle}>Set clear expectations</Text>

      <TextInput
        style={styles.input}
        placeholder="Curfew Time (e.g., 22:00) - Optional"
        value={formData.curfewTime}
        onChangeText={(v) => updateField("curfewTime", v)}
        keyboardType="visible-password"
      />

      <Text style={styles.fieldLabel}>Guest Policy</Text>
      <Picker
        selectedValue={formData.guestPolicy}
        onValueChange={(v) => updateField("guestPolicy", v)}
        style={styles.picker}
        mode="dialog"
        itemStyle={styles.pickerItem}
      >
        {GUEST_POLICIES.map((policy) => (
          <Picker.Item
            key={policy.value}
            label={policy.label}
            value={policy.value}
          />
        ))}
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="Visitor Hours (e.g., 10:00-20:00) - Optional"
        value={formData.visitorHours}
        onChangeText={(v) => updateField("visitorHours", v)}
      />

      <View style={styles.sectionDivider} />

      <Text style={styles.stepTitle}>Photos (Required)</Text>
      <Text style={styles.stepSubtitle}>
        Add photos of rooms, common areas, building exterior
      </Text>

      <TouchableOpacity
        style={styles.photoUploadButton}
        onPress={pickPhotos}
        disabled={formData.photos.length >= MAX_PHOTOS_PER_PG}
      >
        <Text style={styles.photoUploadText}>
          {formData.photos.length === 0
            ? "📷 Add Photos"
            : `📷 ${formData.photos.length}/${MAX_PHOTOS_PER_PG} Photos Added`}
        </Text>
      </TouchableOpacity>

      {formData.photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoPreview}
        >
          {formData.photos.map((photo, index) => (
            <View key={index} style={styles.photoPreviewItem}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.photoPreviewImage}
              />
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.sectionDivider} />

      <Text style={styles.stepTitle}>Documents (For Verification)</Text>
      <Text style={styles.stepSubtitle}>
        Upload ownership proof, license, fire NOC, etc.
      </Text>

      <TouchableOpacity style={styles.docUploadButton} onPress={pickDocuments}>
        <Text style={styles.docUploadText}>
          {formData.documents.length === 0
            ? "📄 Add Documents"
            : `📄 ${formData.documents.length} Documents Added`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((s) => (
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
              {s === 1
                ? "Basic"
                : s === 2
                  ? "Location"
                  : s === 3
                    ? "Rooms"
                    : s === 4
                      ? "Features"
                      : "Rules"}
            </Text>
          </View>
        ))}
        <View style={styles.progressLine} />
        <View
          style={[
            styles.progressLineFill,
            { width: `${((step - 1) / 4) * 100}%` },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>{renderStepContent()}</View>

        {/* Navigation Buttons */}
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
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>
              {submitting
                ? "Submitting..."
                : step === 5
                  ? "Submit for Verification"
                  : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Room Modal */}
      <Modal visible={showRoomModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRoomIndex !== null ? "Edit Room Type" : "Add Room Type"}
              </Text>
              <TouchableOpacity onPress={() => setShowRoomModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Room Name (e.g., Single AC, Double Non-AC)"
              value={roomForm.name}
              onChangeText={(v) =>
                setRoomForm((prev) => ({ ...prev, name: v }))
              }
              autoCapitalize="words"
            />

            <View style={styles.twoInputs}>
              <Picker
                selectedValue={roomForm.sharing?.toString() || "2"}
                onValueChange={(v) =>
                  setRoomForm((prev) => ({ ...prev, sharing: parseInt(v) }))
                }
                style={styles.picker}
                mode="dialog"
                itemStyle={styles.pickerItem}
              >
                {SHARING_OPTIONS.map((s) => (
                  <Picker.Item
                    key={s}
                    label={`${s} Sharing`}
                    value={s.toString()}
                  />
                ))}
              </Picker>

              <TextInput
                style={styles.input}
                placeholder="Number of Rooms"
                value={roomForm.count?.toString() || ""}
                onChangeText={(v) =>
                  setRoomForm((prev) => ({ ...prev, count: parseInt(v) || 0 }))
                }
                keyboardType="numeric"
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Monthly Rent (₹)"
              value={roomForm.rent?.toString() || ""}
              onChangeText={(v) =>
                setRoomForm((prev) => ({ ...prev, rent: parseInt(v) || 0 }))
              }
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Room Amenities</Text>
            <View style={styles.chipGrid}>
              {AMENITIES.filter((a) =>
                ["ac", "wifi", "refrigerator", "geyser", "laundry"].includes(a),
              ).map((amenity) => (
                <TouchableOpacity
                  key={amenity}
                  style={[
                    styles.chip,
                    roomForm.amenities?.includes(amenity) && styles.chipActive,
                  ]}
                  onPress={() =>
                    setRoomForm((prev) => {
                      const arr = prev.amenities || [];
                      const newArr = arr.includes(amenity)
                        ? arr.filter((i) => i !== amenity)
                        : [...arr, amenity];
                      return { ...prev, amenities: newArr };
                    })
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      roomForm.amenities?.includes(amenity) &&
                        styles.chipTextActive,
                    ]}
                  >
                    {AMENITY_LABELS[amenity]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowRoomModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={saveRoom}>
                <Text style={styles.modalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    position: "relative",
  },
  progressStep: {
    flex: 1,
    alignItems: "center",
    zIndex: 2,
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  progressNumberCompleted: {
    color: COLORS.surface,
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
    top: 18,
    left: "10%",
    right: "10%",
    height: 2,
    backgroundColor: COLORS.border,
    zIndex: 1,
  },
  progressLineFill: {
    position: "absolute",
    top: 18,
    left: "10%",
    height: 2,
    backgroundColor: COLORS.primary,
    zIndex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  stepSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
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
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  picker: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  pickerItem: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  twoInputs: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  chip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.lg,
  },
  emptyRoomState: {
    padding: SPACING.xl,
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  roomCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  roomCardInfo: {
    flex: 1,
  },
  roomCardName: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  roomCardDetails: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  roomCardActions: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  iconButton: {
    padding: SPACING.xs,
  },
  iconButtonDanger: {
    padding: SPACING.xs,
  },
  addRoomButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
  },
  addRoomButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
  },
  photoUploadButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  photoUploadText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  photoPreview: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  photoPreviewItem: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
  },
  photoPreviewImage: {
    width: "100%",
    height: "100%",
  },
  docUploadButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: "center",
  },
  docUploadText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
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
    fontSize: FONT_SIZES.md,
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
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: "85%",
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  modalClose: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
  },
  modalButtons: {
    flexDirection: "row",
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
    alignItems: "center",
  },
  modalCancelText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  modalConfirmText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
  },
});

// Need to import Image
import { Image } from "react-native";
