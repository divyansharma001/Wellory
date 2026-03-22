import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createApiClient } from "@health-tracker/api-client";
import { designTokens } from "@health-tracker/design-tokens";
import type {
  AdherenceSummary,
  ApiResponse,
  DashboardData,
  ExerciseLog,
  NutritionGoals,
  WeeklyInsight,
  WaterLog,
  WeightLog,
} from "@health-tracker/types";

type ComposerMode = "water" | "exercise" | "weight" | "log" | "chat";

const defaultBaseUrl = Platform.select({
  android: "http://10.0.2.2:3000",
  default: "http://localhost:3000",
});

function formatNumber(value?: number | null, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${Math.round(value * 10) / 10}${suffix}`;
}

function formatDate(value?: string) {
  if (!value) return "Just now";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function getSeverityTone(severity: WeeklyInsight["severity"]) {
  if (severity === "positive") {
    return {
      backgroundColor: designTokens.colors.primaryFixed,
      color: designTokens.colors.primary,
    };
  }

  if (severity === "warning") {
    return {
      backgroundColor: designTokens.colors.secondarySoft,
      color: designTokens.colors.secondary,
    };
  }

  return {
    backgroundColor: designTokens.colors.surfaceHigh,
    color: designTokens.colors.muted,
  };
}

export default function App() {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl ?? "http://localhost:3000");
  const [authToken, setAuthToken] = useState("");
  const [cookieHeader, setCookieHeader] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>("Checking");
  const [authRequired, setAuthRequired] = useState(false);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [weeklyInsights, setWeeklyInsights] = useState<WeeklyInsight[]>([]);
  const [goals, setGoals] = useState<NutritionGoals | null>(null);
  const [adherence, setAdherence] = useState<AdherenceSummary | null>(null);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

  const [composerMode, setComposerMode] = useState<ComposerMode>("water");
  const [waterAmount, setWaterAmount] = useState("350");
  const [exerciseType, setExerciseType] = useState("Walk");
  const [exerciseMinutes, setExerciseMinutes] = useState("25");
  const [exerciseCalories, setExerciseCalories] = useState("");
  const [weightKg, setWeightKg] = useState("78.4");
  const [reflectionText, setReflectionText] = useState("");
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);

  const getClient = () =>
    createApiClient(baseUrl.trim(), {
      headers: {
        ...(authToken.trim() ? { Authorization: authToken.trim() } : {}),
        ...(cookieHeader.trim() ? { Cookie: cookieHeader.trim() } : {}),
      },
    });

  async function loadAppData(showRefreshState = false) {
    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage(null);

    try {
      const client = getClient();
      const health = await client.getHealth();
      setHealthStatus(`${health.status} • ${formatDate(health.timestamp)}`);

      try {
        const [dashboardRes, insightsRes, goalsRes, adherenceRes, waterRes, exerciseRes, weightRes] =
          await Promise.all([
            client.getDashboard("day"),
            client.getWeeklyInsights(),
            client.getGoals(),
            client.getAdherence(7),
            client.getWaterLogs(),
            client.getExerciseLogs(),
            client.getWeightLogs(),
          ]);

        setDashboard(dashboardRes.data ?? null);
        setWeeklyInsights(insightsRes.data?.insights ?? []);
        setGoals(goalsRes.data ?? null);
        setAdherence(adherenceRes.data ?? null);
        setWaterLogs(waterRes.data ?? []);
        setExerciseLogs(exerciseRes.data ?? []);
        setWeightLogs(weightRes.data ?? []);
        setAuthRequired(false);
      } catch (error) {
        const apiError = error as ApiResponse<unknown>;
        const code = apiError?.error?.code;
        setAuthRequired(code === "UNAUTHORIZED");
        setDashboard(null);
        setWeeklyInsights([]);
        setGoals(null);
        setAdherence(null);
        setWaterLogs([]);
        setExerciseLogs([]);
        setWeightLogs([]);
        setErrorMessage(
          apiError?.error?.message ??
            "Protected data could not be loaded. Add a valid Better Auth cookie or authorization header.",
        );
      }
    } catch {
      setHealthStatus("Offline");
      setErrorMessage("The API server is not reachable. Check the base URL and confirm the backend is running.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAppData();
  }, []);

  async function submitComposer() {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      const client = getClient();

      if (composerMode === "water") {
        const amountMl = Number(waterAmount);
        if (!amountMl || amountMl <= 0) {
          Alert.alert("Water entry", "Enter a valid water amount in milliliters.");
          return;
        }
        await client.createWaterLog({ amountMl });
        setWaterAmount("350");
      }

      if (composerMode === "exercise") {
        const durationMinutes = Number(exerciseMinutes);
        if (!exerciseType.trim() || !durationMinutes || durationMinutes <= 0) {
          Alert.alert("Exercise entry", "Add an activity name and duration.");
          return;
        }
        await client.createExerciseLog({
          activityType: exerciseType.trim(),
          durationMinutes,
          estimatedCaloriesBurned: exerciseCalories.trim() ? Number(exerciseCalories) : undefined,
        });
        setExerciseCalories("");
      }

      if (composerMode === "weight") {
        const value = Number(weightKg);
        if (!value || value <= 0) {
          Alert.alert("Weight entry", "Enter a valid weight in kilograms.");
          return;
        }
        await client.createWeightLog({ weightKg: value });
      }

      if (composerMode === "log") {
        if (!reflectionText.trim()) {
          Alert.alert("Reflection", "Write a short note before saving it.");
          return;
        }
        await client.createLog(reflectionText.trim());
        setReflectionText("");
      }

      if (composerMode === "chat") {
        if (!chatPrompt.trim()) {
          Alert.alert("Coach prompt", "Ask the coach something first.");
          return;
        }
        const response = await client.createChat(chatPrompt.trim());
        setChatAnswer(response.answer);
      }

      await loadAppData(true);
    } catch (error) {
      const apiError = error as ApiResponse<unknown>;
      setErrorMessage(apiError?.error?.message ?? "That request did not complete successfully.");
    } finally {
      setSubmitting(false);
    }
  }

  const quickStats = [
    {
      label: "Calories",
      value: formatNumber(dashboard?.totals.calories),
      target: formatNumber(dashboard?.goals.calories),
    },
    {
      label: "Water",
      value: formatNumber(dashboard?.totals.waterMl, " ml"),
      target: "2000 ml",
    },
    {
      label: "Exercise",
      value: formatNumber(dashboard?.totals.exerciseMinutes, " min"),
      target: "20 min",
    },
    {
      label: "Weight",
      value: formatNumber(dashboard?.latestWeightKg, " kg"),
      target: "Latest",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroOrbPrimary} />
          <View style={styles.heroOrbSecondary} />
          <Text style={styles.brand}>The Editorial Sanctuary</Text>
          <Text style={styles.kicker}>Mobile ritual for calmer tracking</Text>
          <Text style={styles.title}>A softer daily dashboard for meals, motion, hydration, and grounded coaching.</Text>
          <Text style={styles.body}>
            This mobile app now uses the shared API client and the endpoints documented in `API.md`.
            Point it at your server, add session auth, and the sanctuary feed becomes live.
          </Text>

          <View style={styles.glassCard}>
            <Text style={styles.glassLabel}>Server Health</Text>
            <Text style={styles.glassValue}>{healthStatus}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <Text style={styles.sectionBody}>
            Use your local API base URL and provide Better Auth session details for protected routes.
          </Text>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Base URL</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setBaseUrl}
                placeholder="http://localhost:3000"
                placeholderTextColor="rgba(114, 120, 117, 0.55)"
                style={styles.input}
                value={baseUrl}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Authorization Header</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setAuthToken}
                placeholder="Bearer ..."
                placeholderTextColor="rgba(114, 120, 117, 0.55)"
                style={styles.input}
                value={authToken}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cookie Header</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setCookieHeader}
                placeholder="better-auth.session_token=..."
                placeholderTextColor="rgba(114, 120, 117, 0.55)"
                style={styles.input}
                value={cookieHeader}
              />
            </View>

            <Pressable onPress={() => void loadAppData(true)} style={styles.primaryButton}>
              <Text style={styles.primaryButtonLabel}>{refreshing ? "Refreshing..." : "Refresh Sanctuary"}</Text>
            </Pressable>
          </View>

          {errorMessage ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>{authRequired ? "Authentication required" : "Connection note"}</Text>
              <Text style={styles.noticeBody}>{errorMessage}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today at a glance</Text>
          <View style={styles.metricGrid}>
            {quickStats.map((item) => (
              <View key={item.label} style={styles.metricCard}>
                <Text style={styles.metricLabel}>{item.label}</Text>
                <Text style={styles.metricValue}>{item.value}</Text>
                <Text style={styles.metricTarget}>{item.target}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick add</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
            {(["water", "exercise", "weight", "log", "chat"] as ComposerMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setComposerMode(mode)}
                style={[styles.modePill, composerMode === mode ? styles.modePillActive : null]}
              >
                <Text style={[styles.modePillLabel, composerMode === mode ? styles.modePillLabelActive : null]}>
                  {mode === "log" ? "reflection" : mode}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.formCard}>
            {composerMode === "water" ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount in milliliters</Text>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={setWaterAmount}
                  placeholder="350"
                  placeholderTextColor="rgba(114, 120, 117, 0.55)"
                  style={styles.input}
                  value={waterAmount}
                />
              </View>
            ) : null}

            {composerMode === "exercise" ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Activity</Text>
                  <TextInput
                    onChangeText={setExerciseType}
                    placeholder="Walk"
                    placeholderTextColor="rgba(114, 120, 117, 0.55)"
                    style={styles.input}
                    value={exerciseType}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Minutes</Text>
                  <TextInput
                    keyboardType="numeric"
                    onChangeText={setExerciseMinutes}
                    placeholder="25"
                    placeholderTextColor="rgba(114, 120, 117, 0.55)"
                    style={styles.input}
                    value={exerciseMinutes}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Estimated calories burned</Text>
                  <TextInput
                    keyboardType="numeric"
                    onChangeText={setExerciseCalories}
                    placeholder="Optional"
                    placeholderTextColor="rgba(114, 120, 117, 0.55)"
                    style={styles.input}
                    value={exerciseCalories}
                  />
                </View>
              </>
            ) : null}

            {composerMode === "weight" ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight in kilograms</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setWeightKg}
                  placeholder="78.4"
                  placeholderTextColor="rgba(114, 120, 117, 0.55)"
                  style={styles.input}
                  value={weightKg}
                />
              </View>
            ) : null}

            {composerMode === "log" ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Daily reflection</Text>
                <TextInput
                  multiline
                  onChangeText={setReflectionText}
                  placeholder="Energy steady after lunch. Afternoon walk helped."
                  placeholderTextColor="rgba(114, 120, 117, 0.55)"
                  style={[styles.input, styles.textArea]}
                  textAlignVertical="top"
                  value={reflectionText}
                />
              </View>
            ) : null}

            {composerMode === "chat" ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ask your coach</Text>
                  <TextInput
                    multiline
                    onChangeText={setChatPrompt}
                    placeholder="What patterns are showing up in my meals this week?"
                    placeholderTextColor="rgba(114, 120, 117, 0.55)"
                    style={[styles.input, styles.textArea]}
                    textAlignVertical="top"
                    value={chatPrompt}
                  />
                </View>
                {chatAnswer ? (
                  <View style={styles.answerCard}>
                    <Text style={styles.answerLabel}>Coach reply</Text>
                    <Text style={styles.answerText}>{chatAnswer}</Text>
                  </View>
                ) : null}
              </>
            ) : null}

            <Pressable disabled={submitting} onPress={() => void submitComposer()} style={styles.primaryButton}>
              <Text style={styles.primaryButtonLabel}>{submitting ? "Saving..." : "Submit Ritual"}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly signals</Text>
          {weeklyInsights.length ? (
            weeklyInsights.map((insight, index) => {
              const tone = getSeverityTone(insight.severity);
              return (
                <View key={`${insight.title}-${index}`} style={styles.insightRow}>
                  <View style={[styles.insightBadge, { backgroundColor: tone.backgroundColor }]}>
                    <Text style={[styles.insightBadgeText, { color: tone.color }]}>{insight.type}</Text>
                  </View>
                  <View style={styles.insightCopy}>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <Text style={styles.insightMessage}>{insight.message}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No weekly insights yet</Text>
              <Text style={styles.emptyBody}>Once authenticated, `/api/insights/weekly` will populate this section.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals and adherence</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricCardWide}>
              <Text style={styles.metricLabel}>Daily calorie goal</Text>
              <Text style={styles.metricValue}>{formatNumber(goals?.dailyCalories)}</Text>
              <Text style={styles.metricTarget}>{goals?.goalType ?? "Goal not loaded"}</Text>
            </View>
            <View style={styles.metricCardWide}>
              <Text style={styles.metricLabel}>Protein target</Text>
              <Text style={styles.metricValue}>{formatNumber(goals?.dailyProtein, " g")}</Text>
              <Text style={styles.metricTarget}>{goals?.activityLevel ?? "Activity unknown"}</Text>
            </View>
          </View>
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Seven day adherence</Text>
            <Text style={styles.noticeBody}>{adherence?.summaryText ?? "Connect auth to read adherence from `/api/goals/adherence`."}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent activity</Text>

          <View style={styles.feedCard}>
            <Text style={styles.feedTitle}>Hydration</Text>
            {waterLogs.slice(0, 3).map((entry) => (
              <View key={entry.id} style={styles.feedRow}>
                <Text style={styles.feedRowTitle}>{entry.amountMl} ml</Text>
                <Text style={styles.feedRowMeta}>{formatDate(entry.loggedAt)}</Text>
              </View>
            ))}
            {!waterLogs.length ? <Text style={styles.feedEmpty}>No water logs yet.</Text> : null}
          </View>

          <View style={styles.feedCard}>
            <Text style={styles.feedTitle}>Movement</Text>
            {exerciseLogs.slice(0, 3).map((entry) => (
              <View key={entry.id} style={styles.feedRow}>
                <Text style={styles.feedRowTitle}>
                  {entry.activityType} • {entry.durationMinutes} min
                </Text>
                <Text style={styles.feedRowMeta}>{formatDate(entry.loggedAt)}</Text>
              </View>
            ))}
            {!exerciseLogs.length ? <Text style={styles.feedEmpty}>No exercise logs yet.</Text> : null}
          </View>

          <View style={styles.feedCard}>
            <Text style={styles.feedTitle}>Weight</Text>
            {weightLogs.slice(0, 3).map((entry) => (
              <View key={entry.id} style={styles.feedRow}>
                <Text style={styles.feedRowTitle}>{entry.weightKg} kg</Text>
                <Text style={styles.feedRowMeta}>{formatDate(entry.loggedAt)}</Text>
              </View>
            ))}
            {!weightLogs.length ? <Text style={styles.feedEmpty}>No weight logs yet.</Text> : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={designTokens.colors.primary} />
            <Text style={styles.loadingText}>Preparing your sanctuary...</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: designTokens.colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 18,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    padding: 24,
    borderRadius: designTokens.radius.hero,
    backgroundColor: designTokens.colors.surfaceLow,
    gap: 12,
  },
  heroOrbPrimary: {
    position: "absolute",
    right: -48,
    bottom: -52,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(208, 232, 220, 0.7)",
  },
  heroOrbSecondary: {
    position: "absolute",
    top: -18,
    right: 72,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(243, 223, 204, 0.75)",
  },
  brand: {
    color: designTokens.colors.primary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  kicker: {
    color: designTokens.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  title: {
    color: designTokens.colors.text,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -1.4,
    maxWidth: 280,
  },
  body: {
    color: designTokens.colors.muted,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 320,
  },
  glassCard: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: designTokens.radius.card,
    backgroundColor: "rgba(255,255,255,0.84)",
    ...designTokens.shadow.ambient,
  },
  glassLabel: {
    color: designTokens.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  glassValue: {
    color: designTokens.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: designTokens.colors.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  sectionBody: {
    color: designTokens.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  formCard: {
    padding: 18,
    borderRadius: designTokens.radius.card,
    backgroundColor: designTokens.colors.surface,
    gap: 14,
    ...designTokens.shadow.ambient,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    paddingLeft: 4,
    color: designTokens.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  input: {
    borderRadius: designTokens.radius.input,
    backgroundColor: designTokens.colors.surfaceLow,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: designTokens.colors.text,
    fontSize: 15,
  },
  textArea: {
    minHeight: 112,
    paddingTop: 14,
  },
  primaryButton: {
    marginTop: 4,
    borderRadius: designTokens.radius.pill,
    backgroundColor: designTokens.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonLabel: {
    color: designTokens.colors.surfaceLowest,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  noticeCard: {
    padding: 16,
    borderRadius: designTokens.radius.card,
    backgroundColor: designTokens.colors.secondarySoft,
    gap: 6,
  },
  noticeTitle: {
    color: designTokens.colors.secondary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  noticeBody: {
    color: designTokens.colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    width: "47%",
    minWidth: 150,
    padding: 16,
    borderRadius: designTokens.radius.card,
    backgroundColor: designTokens.colors.surface,
    gap: 8,
    ...designTokens.shadow.ambient,
  },
  metricCardWide: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: designTokens.radius.card,
    backgroundColor: designTokens.colors.surface,
    gap: 8,
    ...designTokens.shadow.ambient,
  },
  metricLabel: {
    color: designTokens.colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  metricValue: {
    color: designTokens.colors.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  metricTarget: {
    color: designTokens.colors.outline,
    fontSize: 13,
  },
  pillRow: {
    flexGrow: 0,
  },
  modePill: {
    marginRight: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: designTokens.radius.pill,
    backgroundColor: designTokens.colors.surfaceHigh,
  },
  modePillActive: {
    backgroundColor: designTokens.colors.primaryFixed,
    transform: [{ scale: 1.05 }],
  },
  modePillLabel: {
    color: designTokens.colors.muted,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  modePillLabelActive: {
    color: designTokens.colors.primary,
  },
  answerCard: {
    padding: 16,
    borderRadius: designTokens.radius.card,
    backgroundColor: designTokens.colors.surfaceLow,
    gap: 8,
  },
  answerLabel: {
    color: designTokens.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  answerText: {
    color: designTokens.colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  insightRow: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: designTokens.radius.card,
    backgroundColor: designTokens.colors.surface,
    ...designTokens.shadow.ambient,
  },
  insightBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: designTokens.radius.pill,
  },
  insightBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  insightCopy: {
    flex: 1,
    gap: 4,
  },
  insightTitle: {
    color: designTokens.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  insightMessage: {
    color: designTokens.colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  emptyCard: {
    padding: 18,
    borderRadius: designTokens.radius.card,
    backgroundColor: designTokens.colors.surface,
    gap: 6,
  },
  emptyTitle: {
    color: designTokens.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  emptyBody: {
    color: designTokens.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  feedCard: {
    padding: 18,
    borderRadius: designTokens.radius.card,
    backgroundColor: designTokens.colors.surface,
    gap: 12,
    ...designTokens.shadow.ambient,
  },
  feedTitle: {
    color: designTokens.colors.text,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  feedRow: {
    gap: 4,
  },
  feedRowTitle: {
    color: designTokens.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  feedRowMeta: {
    color: designTokens.colors.outline,
    fontSize: 13,
  },
  feedEmpty: {
    color: designTokens.colors.muted,
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  loadingText: {
    color: designTokens.colors.muted,
    fontSize: 14,
  },
});
