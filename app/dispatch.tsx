import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { clearAuth, getAuth } from "../utils/auth";

// const BACKEND_URL = "http://rayburgappliance.com/rayburg";
const BACKEND_URL = "https://rayburgappliance.com/rayburg";

const { width } = Dimensions.get("window");
const isWide = width > 500;

type ToastType = "success" | "error";

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  visible,
}: {
  message: string;
  type: ToastType;
  visible: boolean;
}) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={[
        toastStyles.container,
        type === "success" ? toastStyles.success : toastStyles.error,
        { transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <View style={toastStyles.iconCircle}>
        <Text style={toastStyles.icon}>{type === "success" ? "✓" : "✕"}</Text>
      </View>
      <Text style={toastStyles.message}>{message}</Text>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 14 : 54,
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 12,
    gap: 12,
  },
  success: { backgroundColor: "#0d3d3d" },
  error: { backgroundColor: "#b83232" },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { color: "#fff", fontSize: 14, fontWeight: "800" },
  message: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "600",
    flex: 1,
    lineHeight: 20,
  },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DispatchForm() {
  const router = useRouter();

  const [techName, setTechName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [warranty, setWarranty] = useState(false);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: ToastType) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3500);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!techName.trim()) e.techName = "Tech name is required.";
    if (!phone.trim()) e.phone = "Phone is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email.";
    if (!businessName.trim()) e.businessName = "Business name is required.";
    if (!businessAddress.trim())
      e.businessAddress = "Business address is required.";
    if (!brand.trim()) e.brand = "Brand is required.";
    if (!model.trim()) e.model = "Model is required.";
    if (!serialNumber.trim()) e.serialNumber = "Serial number is required.";
    if (!reason.trim()) e.reason = "Reason for dispatch is required.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      showToast("Please fix the errors before submitting.", "error");
      return;
    }

    setSending(true);
    try {
      const { token } = await getAuth();
      const response = await fetch(`${BACKEND_URL}/send-dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          techName,
          phone,
          email,
          businessName,
          businessAddress,
          brand,
          model,
          serialNumber,
          warranty,
          reason,
        }),
      });

      if (response.ok) {
        showToast("Dispatch sent to email successfully!", "success");
        setTimeout(() => resetForm(), 600);
      } else {
        const data = await response.json().catch(() => ({}));
        showToast(data?.error || "Server error. Email not sent.", "error");
      }
    } catch {
      showToast("Connection failed. Please check your network.", "error");
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTechName("");
    setPhone("");
    setEmail("");
    setBusinessName("");
    setBusinessAddress("");
    setBrand("");
    setModel("");
    setSerialNumber("");
    setWarranty(false);
    setReason("");
    setErrors({});
  };

  const clearError = (field: string) =>
    setErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });

  const inputStyle = (field: string) => [
    styles.input,
    errors[field] ? styles.inputError : null,
  ];

  const handleLogout = async () => {
    await clearAuth();
    router.replace("/");
  };

  return (
    <View style={styles.bg}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0d6e6e"
        translucent={false}
      />
      <Toast message={toastMessage} type={toastType} visible={toastVisible} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* ── Header ── */}
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.cardHeader}>
              <View style={styles.headerTitleBlock}>
                <Text style={styles.formTitle}>Dispatch Form</Text>
                <Text style={styles.formSubtitle}>Submit dispatch details</Text>
              </View>
              <View style={styles.headerBtnCol}>
                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={handleLogout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.accountBtn}
                  onPress={() => router.push("/account")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.accountBtnText}>Account</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* ── TECHNICIAN ── */}
            <SectionHeader title="TECHNICIAN" />
            <FieldLabel label="Tech Name" />
            <TextInput
              placeholder="Full name"
              placeholderTextColor="#a0b8b8"
              style={inputStyle("techName")}
              value={techName}
              onChangeText={(v) => {
                setTechName(v);
                clearError("techName");
              }}
            />
            {errors.techName ? (
              <Text style={styles.errorText}>{errors.techName}</Text>
            ) : null}

            <View style={styles.row}>
              <View style={styles.halfLeft}>
                <FieldLabel label="Phone" />
                <TextInput
                  placeholder="+1 000 000 0000"
                  placeholderTextColor="#a0b8b8"
                  style={inputStyle("phone")}
                  value={phone}
                  onChangeText={(v) => {
                    setPhone(v);
                    clearError("phone");
                  }}
                  keyboardType="phone-pad"
                />
                {errors.phone ? (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                ) : null}
              </View>
              <View style={styles.halfRight}>
                <FieldLabel label="Email Address" />
                <TextInput
                  placeholder="name@email.com"
                  placeholderTextColor="#a0b8b8"
                  style={inputStyle("email")}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    clearError("email");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.sectionDivider} />

            {/* ── BUSINESS ── */}
            <SectionHeader title="BUSINESS" />
            <FieldLabel label="Business Name" />
            <TextInput
              placeholder="Company or client name"
              placeholderTextColor="#a0b8b8"
              style={inputStyle("businessName")}
              value={businessName}
              onChangeText={(v) => {
                setBusinessName(v);
                clearError("businessName");
              }}
            />
            {errors.businessName ? (
              <Text style={styles.errorText}>{errors.businessName}</Text>
            ) : null}

            <FieldLabel label="Business Address" />
            <TextInput
              placeholder="Street, City, State, ZIP"
              placeholderTextColor="#a0b8b8"
              style={inputStyle("businessAddress")}
              value={businessAddress}
              onChangeText={(v) => {
                setBusinessAddress(v);
                clearError("businessAddress");
              }}
            />
            {errors.businessAddress ? (
              <Text style={styles.errorText}>{errors.businessAddress}</Text>
            ) : null}

            <View style={styles.sectionDivider} />

            {/* ── APPLIANCE ── */}
            <SectionHeader title="APPLIANCE" />
            <View style={styles.row}>
              <View style={styles.halfLeft}>
                <FieldLabel label="Brand" />
                <TextInput
                  placeholder="Brand name"
                  placeholderTextColor="#a0b8b8"
                  style={inputStyle("brand")}
                  value={brand}
                  onChangeText={(v) => {
                    setBrand(v);
                    clearError("brand");
                  }}
                />
                {errors.brand ? (
                  <Text style={styles.errorText}>{errors.brand}</Text>
                ) : null}
              </View>
              <View style={styles.halfRight}>
                <FieldLabel label="Model" />
                <TextInput
                  placeholder="Model number"
                  placeholderTextColor="#a0b8b8"
                  style={inputStyle("model")}
                  value={model}
                  onChangeText={(v) => {
                    setModel(v);
                    clearError("model");
                  }}
                />
                {errors.model ? (
                  <Text style={styles.errorText}>{errors.model}</Text>
                ) : null}
              </View>
            </View>

            <FieldLabel label="Serial Number" />
            <TextInput
              placeholder="SN-XXXXXXXXXX"
              placeholderTextColor="#a0b8b8"
              style={inputStyle("serialNumber")}
              value={serialNumber}
              onChangeText={(v) => {
                setSerialNumber(v);
                clearError("serialNumber");
              }}
              autoCapitalize="characters"
            />
            {errors.serialNumber ? (
              <Text style={styles.errorText}>{errors.serialNumber}</Text>
            ) : null}

            <View style={styles.warrantyRow}>
              <Text style={styles.fieldLabel}>Warranty</Text>
              <Switch
                value={warranty}
                onValueChange={setWarranty}
                thumbColor={warranty ? "#fff" : "#ccc"}
                trackColor={{ false: "#d0dde6", true: "#1a8080" }}
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>

            <View style={styles.sectionDivider} />

            {/* ── REASON ── */}
            <SectionHeader title="REASON FOR DISPATCH" />
            <TextInput
              placeholder="Describe the issue, symptoms, or service requested..."
              placeholderTextColor="#a0b8b8"
              style={[inputStyle("reason"), styles.textarea]}
              value={reason}
              onChangeText={(v) => {
                setReason(v);
                clearError("reason");
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.reason ? (
              <Text style={styles.errorText}>{errors.reason}</Text>
            ) : null}

            {/* ── SUBMIT ── */}
            <TouchableOpacity
              style={[styles.submitBtn, sending && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={sending}
            >
              {sending ? (
                <View style={styles.sendingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.submitText, { marginLeft: 10 }]}>
                    Sending...
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  bg: {
    flex: 1,
    backgroundColor: "#0d6e6e",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 14,
  },
  card: {
    width: "100%",
    maxWidth: 600,
    backgroundColor: "#f4f8fb",
    borderRadius: 22,
    paddingHorizontal: isWide ? 36 : 20,
    paddingVertical: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: {
    width: 140,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitleBlock: {
    flexDirection: "column",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0d3d3d",
    letterSpacing: 0.2,
  },
  formSubtitle: {
    fontSize: 12,
    color: "#5a8080",
    marginTop: 2,
  },
  headerBtnCol: {
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-end",
  },
  logoutBtn: {
    backgroundColor: "#0d3d3d",
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 90,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  accountBtn: {
    // display: "none",
    backgroundColor: "#1a6060",
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 90,
    alignItems: "center",
  },
  accountBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  divider: { height: 1, backgroundColor: "#d0dde6", marginBottom: 20 },
  sectionDivider: { height: 1, backgroundColor: "#e0eaee", marginVertical: 18 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1a6060",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: "#d0e8e8" },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#1a6060",
    marginBottom: 5,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    borderRadius: 9,
    marginBottom: 4,
    fontSize: 14,
    color: "#0d3d3d",
    borderWidth: 1.5,
    borderColor: "#dce8ee",
  },
  inputError: { borderColor: "#e05555", backgroundColor: "#fff4f4" },
  errorText: {
    color: "#e05555",
    fontSize: 11.5,
    marginBottom: 6,
    marginLeft: 2,
  },
  row: { flexDirection: "row", gap: 10 },
  halfLeft: { flex: 1 },
  halfRight: { flex: 1 },
  warrantyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 2,
  },
  textarea: {
    height: 110,
    paddingTop: Platform.OS === "ios" ? 12 : 10,
  },
  submitBtn: {
    backgroundColor: "#0d3d3d",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 22,
    shadowColor: "#0d3d3d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: { backgroundColor: "#3a7070", elevation: 0 },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  sendingRow: { flexDirection: "row", alignItems: "center" },
});
