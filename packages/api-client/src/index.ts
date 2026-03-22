import type {
  ApiResponse,
  FoodLog,
  GoalRecommendation,
  NutritionGoals,
  VoiceLog,
  WeeklyInsight,
} from "@health-tracker/types";

export interface ApiClientOptions {
  baseUrl: string;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly headers?: HeadersInit;
  private readonly credentials: RequestCredentials;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.headers = options.headers;
    this.credentials = options.credentials ?? "include";
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: this.credentials,
      headers: {
        ...this.headers,
        ...(init?.headers ?? {}),
      },
    });

    const data = (await response.json()) as T;
    if (!response.ok) {
      throw data;
    }

    return data;
  }

  private json<T>(path: string, method: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request("/health");
  }

  createLog(content: string) {
    return this.json("/api/logs", "POST", { content });
  }

  createChat(message: string) {
    return this.json("/api/chat", "POST", { message });
  }

  uploadFoodPhoto(formData: FormData) {
    return this.request("/api/food", {
      method: "POST",
      body: formData,
    });
  }

  createManualFoodLog(payload: unknown) {
    return this.json<ApiResponse<FoodLog>>("/api/food/manual", "POST", payload);
  }

  getFoodLogs() {
    return this.request<ApiResponse<FoodLog[]>>("/api/food");
  }

  getFoodLog(id: string) {
    return this.request<ApiResponse<FoodLog>>(`/api/food/${id}`);
  }

  getFoodHistory(id: string) {
    return this.request(`/api/food/${id}/history`);
  }

  updateFoodLog(id: string, payload: unknown) {
    return this.json<ApiResponse<FoodLog>>(`/api/food/${id}`, "PATCH", payload);
  }

  deleteFoodLog(id: string) {
    return this.request(`/api/food/${id}`, { method: "DELETE" });
  }

  uploadVoiceLog(formData: FormData) {
    return this.request("/api/voice-logs", {
      method: "POST",
      body: formData,
    });
  }

  getVoiceLogs() {
    return this.request<ApiResponse<VoiceLog[]>>("/api/voice-logs");
  }

  getVoiceLog(id: string) {
    return this.request<ApiResponse<VoiceLog>>(`/api/voice-logs/${id}`);
  }

  getGoals() {
    return this.request<ApiResponse<NutritionGoals>>("/api/goals");
  }

  updateGoals(payload: NutritionGoals) {
    return this.json<ApiResponse<NutritionGoals>>("/api/goals", "PUT", payload);
  }

  getNutritionSummary(period: "day" | "week") {
    return this.request(`/api/goals/nutrition?period=${period}`);
  }

  getNutritionProgress(days = 30) {
    return this.request(`/api/goals/progress?days=${days}`);
  }

  getGoalRecommendations(days = 14) {
    return this.request<ApiResponse<{ from: string; to: string; recommendation: GoalRecommendation }>>(
      `/api/goals/recommendations?days=${days}`,
    );
  }

  getAdherence(days = 7) {
    return this.request(`/api/goals/adherence?days=${days}`);
  }

  getDashboard(period: "day" | "week") {
    return this.request(`/api/dashboard/${period}`);
  }

  getWeeklyInsights() {
    return this.request<ApiResponse<{ from: string; to: string; insights: WeeklyInsight[] }>>(
      "/api/insights/weekly",
    );
  }

  createWaterLog(payload: { amountMl: number; loggedAt?: string }) {
    return this.json("/api/water", "POST", payload);
  }

  getWaterLogs() {
    return this.request("/api/water");
  }

  deleteWaterLog(id: string) {
    return this.request(`/api/water/${id}`, { method: "DELETE" });
  }

  createExerciseLog(payload: {
    activityType: string;
    durationMinutes: number;
    estimatedCaloriesBurned?: number | null;
    notes?: string;
    loggedAt?: string;
  }) {
    return this.json("/api/exercise", "POST", payload);
  }

  getExerciseLogs() {
    return this.request("/api/exercise");
  }

  deleteExerciseLog(id: string) {
    return this.request(`/api/exercise/${id}`, { method: "DELETE" });
  }

  createWeightLog(payload: { weightKg: number; notes?: string; loggedAt?: string }) {
    return this.json("/api/weight", "POST", payload);
  }

  getWeightLogs() {
    return this.request("/api/weight");
  }

  deleteWeightLog(id: string) {
    return this.request(`/api/weight/${id}`, { method: "DELETE" });
  }
}

export function createApiClient(baseUrl: string) {
  return new ApiClient({ baseUrl });
}
