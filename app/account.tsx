import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { clearAuth, getAuth } from "../utils/auth";

// const BACKEND_URL = "http://192.168.29.82:3000";https://rayburgappliance.com/rayburg/index.php/health
const BACKEND_URL = "https://rayburgappliance.com/rayburg";

export default function AccountScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getAuth().then(({ email }) => {
      if (email) setEmail(email);
    });
  }, []);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: confirmDelete },
      ],
    );
  };

  const confirmDelete = async () => {
    if (!password.trim()) {
      setError("Please enter your password to confirm.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { token } = await getAuth();
      const res = await fetch(`${BACKEND_URL}/auth/delete-account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete account.");
        return;
      }
      await clearAuth();
      router.replace("/");
    } catch {
      setError("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.bg}>
      <StatusBar barStyle="light-content" backgroundColor="#0d6e6e" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Account Settings</Text>
          <Text style={styles.subtitle}>{email}</Text>
          <View style={styles.divider} />

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>⚠ Delete Account</Text>
            <Text style={styles.dangerDesc}>
              Permanently deletes your account. Enter your password to confirm.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <TextInput
              placeholder="Your current password"
              placeholderTextColor="#a0b8b8"
              style={styles.input}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError("");
              }}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.deleteBtn, loading && { opacity: 0.6 }]}
              onPress={handleDeleteAccount}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteBtnText}>Delete My Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>← Back to Dispatch</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#0d6e6e",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#f4f8fb",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0d3d3d",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#5a8080",
    textAlign: "center",
    marginTop: 4,
  },
  divider: { height: 1, backgroundColor: "#d0dde6", marginVertical: 22 },
  dangerZone: {
    backgroundColor: "#fff5f5",
    borderWidth: 1.5,
    borderColor: "#f5c6c6",
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#c0392b",
    marginBottom: 6,
  },
  dangerDesc: {
    fontSize: 13,
    color: "#6a4040",
    marginBottom: 16,
    lineHeight: 19,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#1a6060",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    borderRadius: 9,
    marginBottom: 12,
    fontSize: 14,
    color: "#0d3d3d",
    borderWidth: 1.5,
    borderColor: "#dce8ee",
  },
  deleteBtn: {
    backgroundColor: "#c0392b",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  errorText: {
    color: "#c0392b",
    fontSize: 12.5,
    marginBottom: 10,
    backgroundColor: "#ffe8e8",
    padding: 8,
    borderRadius: 6,
  },
  successText: {
    color: "#1a8050",
    fontSize: 12.5,
    marginBottom: 10,
    backgroundColor: "#e8f9f0",
    padding: 8,
    borderRadius: 6,
  },
  backBtn: { alignItems: "center", paddingVertical: 12 },
  backBtnText: { color: "#1a6060", fontSize: 14, fontWeight: "600" },
});
