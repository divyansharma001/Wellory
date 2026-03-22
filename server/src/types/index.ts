import type { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  requestId: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type FoodLogStatus = "pending" | "completed" | "failed";
export type FoodEntryMode = "photo" | "manual" | "hybrid";
export type FoodLogRevisionType = "ai_initial" | "manual_initial" | "user_edit" | "reprocess";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LogEntry {
  id: string;
  userId: string;
  content: string;
  type: string;
  status: "pending" | "processed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLogInput {
  content: string;
}

export interface Fact {
  id: string;
  text: string;
  userId: string;
  sourceLogId: string;
  timestamp: string;
  type: string;
}

export interface RankedFact extends Fact {
  similarity: number;
  recency: number;
  combinedScore: number;
  polarity: number;
}

export interface ChatInput {
  message: string;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  debug?: {
    factsUsed: number;
    logsUsed: number;
    hasSummary: boolean;
    verification: string;
    cacheHit?: boolean;
  };
}

export interface ChatContext {
  factsContext: string;
  logsContext: string;
  currentContext: string;
  conflictsContext: string;
  combinedContextForVerifier: string;
  debug: {
    factsUsed: number;
    logsUsed: number;
    hasSummary: boolean;
    verification: string;
  };
}

export interface DailySummary {
  id: string;
  text: string;
  userId: string;
  date: string;
  lastUpdated: string;
}

export interface LogPayload {
  text: string;
  userId: string;
  timestamp: string;
  type: string;
}

export interface FactPayload {
  text: string;
  sourceLogId: string;
  userId: string;
  timestamp: string;
  type: string;
}

export interface SummaryPayload {
  text: string;
  userId: string;
  date: string;
  type: string;
  lastUpdated: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    errors?: Record<string, string[]>;
  };
}

export interface LogJobData {
  logId: string;
  userId: string;
  text: string;
}

export interface DetectedFood {
  name: string;
  estimatedPortion: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  confidence: number | null;
}

export interface FoodAnalysisResult {
  detectedFoods: DetectedFood[];
  totalCalories: number | null;
  totalProtein: number | null;
  totalCarbs: number | null;
  totalFat: number | null;
  notes?: string | null;
}

export interface FoodCorrectionData extends FoodAnalysisResult {}

export interface FoodLogJobData {
  foodLogId: string;
  userId: string;
  imagePath: string;
  mimeType: string;
}

export interface FoodLogRevisionPayload extends FoodAnalysisResult {
  title?: string | null;
  mealType?: MealType | null;
  notes?: string | null;
  imageUrl?: string | null;
  entryMode?: FoodEntryMode | null;
}

export type VoiceLogStatus = "pending" | "completed" | "failed";

export interface VoiceLogJobData {
  voiceLogId: string;
  userId: string;
  audioPath: string;
  mimeType: string;
}

export type GoalType = "lose" | "maintain" | "gain";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type NutritionPeriod = "day" | "week";

export interface NutritionGoalRecord {
  id: string;
  userId: string;
  dailyCalories: number | null;
  dailyProtein: number | null;
  dailyCarbs: number | null;
  dailyFat: number | null;
  goalType: GoalType | null;
  activityLevel: ActivityLevel | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyNutritionSummaryRecord {
  id: string;
  userId: string;
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  breakfastCalories: number;
  lunchCalories: number;
  dinnerCalories: number;
  snackCalories: number;
  createdAt: Date;
  updatedAt: Date;
}
