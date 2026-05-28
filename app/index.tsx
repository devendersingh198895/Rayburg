import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAuth, saveAuth } from "../utils/auth";

const BACKEND_URL = "https://rayburgappliance.com/rayburg";

type Mode = "login" | "register";
type Phase = "splash" | "skeleton" | "form";

// ─── Skeleton bone ────────────────────────────────────────────────────────────
function SkeletonBone({
  w,
  h,
  radius = 8,
  style,
}: {
  w: number | string;
  h: number;
  radius?: number;
  style?: object;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });
  return (
    <Animated.View
      style={[
        {
          width: w as any,
          height: h,
          borderRadius: radius,
          backgroundColor: "#c8dadf",
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function FormSkeleton() {
  return (
    <View style={{ width: "100%", paddingHorizontal: 2 }}>
      <SkeletonBone w="55%" h={22} radius={6} style={{ marginBottom: 6 }} />
      <SkeletonBone w="38%" h={13} radius={5} style={{ marginBottom: 24 }} />
      <View
        style={{ height: 1, backgroundColor: "#d0dde6", marginBottom: 22 }}
      />
      <SkeletonBone w="30%" h={12} radius={4} style={{ marginBottom: 8 }} />
      <SkeletonBone w="100%" h={46} radius={9} style={{ marginBottom: 16 }} />
      <SkeletonBone w="30%" h={12} radius={4} style={{ marginBottom: 8 }} />
      <SkeletonBone w="100%" h={46} radius={9} style={{ marginBottom: 16 }} />
      <SkeletonBone w="35%" h={12} radius={4} style={{ marginBottom: 8 }} />
      <SkeletonBone w="55%" h={56} radius={10} style={{ marginBottom: 10 }} />
      <SkeletonBone w="100%" h={46} radius={9} style={{ marginBottom: 28 }} />
      <SkeletonBone w="100%" h={52} radius={12} />
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("splash");
  const [mode, setMode] = useState<Mode>("login");

  // ── Login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ── Register fields
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityKey, setSecurityKey] = useState("");

  // ── Captcha (login only)
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b, answer: a + b };
  });

  const refreshCaptcha = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ a, b, answer: a + b });
    setCaptchaAnswer("");
    clearError("captcha");
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // ── Animations
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashScale = useRef(new Animated.Value(1)).current;
  const splashPulse = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;
  const logoCardScale = useRef(new Animated.Value(0.82)).current;
  const logoCardOpacity = useRef(new Animated.Value(0)).current;

  // Auto-login if token exists
  useEffect(() => {
    getAuth().then(({ token }) => {
      if (token) router.replace("/dispatch");
    });
  }, []);

  // Splash → skeleton → form
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(splashPulse, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(splashPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    const t1 = setTimeout(() => {
      pulse.stop();
      Animated.parallel([
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(splashScale, {
          toValue: 1.18,
          duration: 380,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setPhase("skeleton");
        Animated.parallel([
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.timing(cardTranslateY, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 1600);

    const t2 = setTimeout(() => {
      setPhase("form");
      Animated.parallel([
        Animated.spring(logoCardScale, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(logoCardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const clearError = (f: string) =>
    setErrors((p) => {
      const n = { ...p };
      delete n[f];
      return n;
    });

  // ── Submit ────────────────────────────────────────────────────────────────   newUser123
  const handleSubmit = async () => {
    const e: Record<string, string> = {};

    if (mode === "login") {
      if (!username.trim()) e.username = "Username is required.";
      if (!password.trim()) e.password = "Password is required.";
      else if (password.length < 6) e.password = "Min 6 characters.";
      if (!captchaAnswer.trim()) e.captcha = "Please enter the answer.";
      else if (parseInt(captchaAnswer) !== captcha.answer) {
        e.captcha = "Incorrect answer. Try again.";
        refreshCaptcha();
      }
    } else {
      if (!regUsername.trim()) e.regUsername = "Username is required.";
      else if (regUsername.trim().length < 3)
        e.regUsername = "Min 3 characters.";
      else if (/\s/.test(regUsername)) e.regUsername = "No spaces allowed.";
      if (!regEmail.trim()) e.regEmail = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(regEmail))
        e.regEmail = "Enter a valid email.";
      if (!regPassword.trim()) e.regPassword = "Password is required.";
      else if (regPassword.length < 6) e.regPassword = "Min 6 characters.";
      if (regPassword !== confirmPassword)
        e.confirmPassword = "Passwords do not match.";
      if (!securityKey.trim()) e.securityKey = "Security key is required.";
    }

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setLoading(true);
    setServerError("");
    try {
      if (mode === "login") {
        const cleanUser = username.trim().toLowerCase();

        // ── TEMPORARY ADMIN BYPASS ──
        if (cleanUser === "admin" && password === "admin1234") {
          // Simulate a successful response from the server
          const mockToken = "temp-admin-token-123";
          const mockEmail = "admin@rayburgappliance.com";

          await saveAuth(mockToken, mockEmail);
          router.replace("/dispatch");
          return; // Exit the function early
        }

        // ── NORMAL AUTH FLOW ──
        const res = await fetch(`${BACKEND_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: cleanUser,
            password,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setServerError(data.error || "Something went wrong.");
          return;
        }
        await saveAuth(data.token, data.email);
        router.replace("/dispatch");
      } else {
        const res = await fetch(`${BACKEND_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: regUsername.trim().toLowerCase(),
            email: regEmail.trim().toLowerCase(),
            password: regPassword,
            securityKey,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setServerError(data.error || "Something went wrong.");
          return;
        }
        await saveAuth(data.token, data.email);
        router.replace("/dispatch");
      }
    } catch {
      setServerError("Connection failed. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  // ── SPLASH ────────────────────────────────────────────────────────────────
  if (phase === "splash") {
    return (
      <View style={styles.splashBg}>
        <StatusBar barStyle="light-content" backgroundColor="#0d6e6e" />
        <Animated.View
          style={{
            transform: [{ scale: splashPulse }],
            opacity: splashOpacity,
          }}
        >
          <View style={styles.splashGlow} />
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.splashLogo}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.Text
          style={[styles.splashTagline, { opacity: splashOpacity }]}
        >
          Rayburg Appliance
        </Animated.Text>
      </View>
    );
  }

  // ── CARD ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.bg}>
      <StatusBar barStyle="light-content" backgroundColor="#0d6e6e" />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
          >
            {phase === "skeleton" ? (
              <FormSkeleton />
            ) : (
              <>
                {/* Logo */}
                <Animated.View
                  style={{
                    alignSelf: "center",
                    marginBottom: 8,
                    opacity: logoCardOpacity,
                    transform: [{ scale: logoCardScale }],
                  }}
                >
                  <Image
                    source={require("../assets/images/logo.png")}
                    style={styles.cardLogo}
                    resizeMode="contain"
                  />
                </Animated.View>

                <Text style={styles.formTitle}>
                  {mode === "login" ? "Admin Login" : "Create Account"}
                </Text>
                <Text style={styles.formSubtitle}>
                  {mode === "login"
                    ? "Secure access to dashboard"
                    : "Register a new account"}
                </Text>

                <View style={styles.divider} />

                {/* Mode toggle */}
                <View style={[styles.modeRow, { display: "none" }]}>
                  <TouchableOpacity
                    style={[
                      styles.modeBtn,
                      mode === "login" && styles.modeBtnActive,
                    ]}
                    onPress={() => {
                      setMode("login");
                      setErrors({});
                      setServerError("");
                      refreshCaptcha();
                    }}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        mode === "login" && styles.modeBtnTextActive,
                      ]}
                    >
                      Login
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modeBtn,
                      mode === "register" && styles.modeBtnActive,
                    ]}
                    onPress={() => {
                      setMode("register");
                      setErrors({});
                      setServerError("");
                    }}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        mode === "register" && styles.modeBtnTextActive,
                      ]}
                    >
                      Register
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Server error */}
                {serverError ? (
                  <Text style={styles.serverError}>{serverError}</Text>
                ) : null}

                {/* ── LOGIN FIELDS ── */}
                {mode === "login" ? (
                  <>
                    <Text style={styles.fieldLabel}>Username</Text>
                    <TextInput
                      placeholder="Enter username"
                      placeholderTextColor="#a0b8b8"
                      style={[
                        styles.input,
                        errors.username && styles.inputError,
                      ]}
                      value={username}
                      onChangeText={(v) => {
                        setUsername(v);
                        clearError("username");
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {errors.username ? (
                      <Text style={styles.errorText}>{errors.username}</Text>
                    ) : null}

                    <Text style={styles.fieldLabel}>Password</Text>
                    <TextInput
                      placeholder="Enter password"
                      placeholderTextColor="#a0b8b8"
                      style={[
                        styles.input,
                        errors.password && styles.inputError,
                      ]}
                      value={password}
                      onChangeText={(v) => {
                        setPassword(v);
                        clearError("password");
                      }}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                    {errors.password ? (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    ) : null}

                    {/* Captcha */}
                    <Text style={styles.fieldLabel}>Verification</Text>
                    <View style={styles.captchaBox}>
                      <Text style={styles.captchaText}>
                        {captcha.a} + {captcha.b} = ?
                      </Text>
                    </View>
                    <TextInput
                      placeholder="Enter result"
                      placeholderTextColor="#a0b8b8"
                      style={[
                        styles.input,
                        errors.captcha && styles.inputError,
                      ]}
                      value={captchaAnswer}
                      onChangeText={(v) => {
                        setCaptchaAnswer(v);
                        clearError("captcha");
                      }}
                      keyboardType="numeric"
                    />
                    {errors.captcha ? (
                      <Text style={styles.errorText}>{errors.captcha}</Text>
                    ) : null}
                  </>
                ) : (
                  /* ── REGISTER FIELDS ── */
                  <>
                    <Text style={styles.fieldLabel}>Username</Text>
                    <TextInput
                      placeholder="Choose a username"
                      placeholderTextColor="#a0b8b8"
                      style={[
                        styles.input,
                        errors.regUsername && styles.inputError,
                      ]}
                      value={regUsername}
                      onChangeText={(v) => {
                        setRegUsername(v);
                        clearError("regUsername");
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {errors.regUsername ? (
                      <Text style={styles.errorText}>{errors.regUsername}</Text>
                    ) : null}

                    <Text style={styles.fieldLabel}>Email</Text>
                    <TextInput
                      placeholder="name@email.com"
                      placeholderTextColor="#a0b8b8"
                      style={[
                        styles.input,
                        errors.regEmail && styles.inputError,
                      ]}
                      value={regEmail}
                      onChangeText={(v) => {
                        setRegEmail(v);
                        clearError("regEmail");
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {errors.regEmail ? (
                      <Text style={styles.errorText}>{errors.regEmail}</Text>
                    ) : null}

                    <Text style={styles.fieldLabel}>Password</Text>
                    <TextInput
                      placeholder="Min 6 characters"
                      placeholderTextColor="#a0b8b8"
                      style={[
                        styles.input,
                        errors.regPassword && styles.inputError,
                      ]}
                      value={regPassword}
                      onChangeText={(v) => {
                        setRegPassword(v);
                        clearError("regPassword");
                      }}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                    {errors.regPassword ? (
                      <Text style={styles.errorText}>{errors.regPassword}</Text>
                    ) : null}

                    <Text style={styles.fieldLabel}>Confirm Password</Text>
                    <TextInput
                      placeholder="Re-enter password"
                      placeholderTextColor="#a0b8b8"
                      style={[
                        styles.input,
                        errors.confirmPassword && styles.inputError,
                      ]}
                      value={confirmPassword}
                      onChangeText={(v) => {
                        setConfirmPassword(v);
                        clearError("confirmPassword");
                      }}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                    {errors.confirmPassword ? (
                      <Text style={styles.errorText}>
                        {errors.confirmPassword}
                      </Text>
                    ) : null}

                    {/* ── Security Key ── */}
                    <View style={styles.secKeyHeader}>
                      <Text style={styles.fieldLabel}>Security Key</Text>
                      <View style={styles.secKeyBadge}>
                        <Text style={styles.secKeyBadgeText}>🔑 Required</Text>
                      </View>
                    </View>
                    <TextInput
                      placeholder="Enter registration security key"
                      placeholderTextColor="#a0b8b8"
                      style={[
                        styles.input,
                        errors.securityKey && styles.inputError,
                      ]}
                      value={securityKey}
                      onChangeText={(v) => {
                        setSecurityKey(v);
                        clearError("securityKey");
                      }}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {errors.securityKey ? (
                      <Text style={styles.errorText}>{errors.securityKey}</Text>
                    ) : (
                      <Text style={styles.secKeyHint}>
                        This key is provided by your administrator.
                      </Text>
                    )}
                  </>
                )}

                {/* Submit button */}
                <TouchableOpacity
                  style={[
                    styles.loginBtn,
                    loading && { backgroundColor: "#3a7070" },
                  ]}
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginText}>
                      {mode === "login" ? "Login" : "Create Account"}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  splashBg: {
    flex: 1,
    backgroundColor: "#0d6e6e",
    alignItems: "center",
    justifyContent: "center",
  },
  splashGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignSelf: "center",
    top: -20,
  },
  splashLogo: { width: 180, height: 130 },
  splashTagline: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginTop: 30,
    fontWeight: "500",
  },
  bg: {
    flex: 1,
    backgroundColor: "#0d6e6e",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0,
  },
  bgCircle1: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -80,
    right: -80,
  },
  bgCircle2: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: 60,
    left: -60,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#f4f8fb",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
  },
  cardLogo: { width: 120, height: 80 },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0d3d3d",
    textAlign: "center",
    letterSpacing: 0.2,
    marginTop: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: "#5a8080",
    textAlign: "center",
    marginTop: 4,
  },
  divider: { height: 1, backgroundColor: "#d0dde6", marginVertical: 22 },
  modeRow: {
    flexDirection: "row",
    backgroundColor: "#e8f0f4",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 8,
  },
  modeBtnActive: { backgroundColor: "#0d3d3d" },
  modeBtnText: { fontSize: 13, fontWeight: "600", color: "#5a8080" },
  modeBtnTextActive: { color: "#fff" },
  serverError: {
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#e05555",
    borderRadius: 8,
    padding: 10,
    color: "#c0392b",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#1a6060",
    marginBottom: 6,
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
    marginBottom: 8,
    marginLeft: 2,
  },
  captchaBox: {
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: "#67b8b8",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: "#E8F5F3",
  },
  captchaText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0d3d3d",
    letterSpacing: 3,
  },
  secKeyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    marginTop: 2,
  },
  secKeyBadge: {
    backgroundColor: "#fff3cd",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  secKeyBadgeText: { fontSize: 10.5, fontWeight: "700", color: "#856404" },
  secKeyHint: {
    fontSize: 11,
    color: "#7a9a9a",
    marginBottom: 8,
    marginLeft: 2,
    fontStyle: "italic",
  },
  loginBtn: {
    backgroundColor: "#0d3d3d",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#0d3d3d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 7,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
