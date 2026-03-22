export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type GoalType = "lose" | "maintain" | "gain";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export interface DetectedFood {
  name: string;
  estimatedPortion: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  confidence: number | null;
}

export interface FoodLog {
  id: string;
  title?: string | null;
  entryMode: "photo" | "manual" | "hybrid";
  mealType?: MealType | null;
  notes?: string | null;
  imageUrl?: string | null;
  status: "pending" | "completed" | "failed";
  totalCalories?: number | null;
  totalProtein?: number | null;
  totalCarbs?: number | null;
  totalFat?: number | null;
  detectedFoods?: DetectedFood[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoiceLog {
  id: string;
  audioUrl?: string | null;
  transcript?: string | null;
  status: "pending" | "completed" | "failed";
  createdLogEntryId?: string | null;
  createdAt?: string;
}

export interface NutritionGoals {
  dailyCalories?: number | null;
  dailyProtein?: number | null;
  dailyCarbs?: number | null;
  dailyFat?: number | null;
  goalType?: GoalType | null;
  activityLevel?: ActivityLevel | null;
}

export interface WeeklyInsight {
  type: "protein" | "hydration" | "calories" | "exercise" | "logging" | "weight";
  title: string;
  message: string;
  severity: "info" | "warning" | "positive";
}

export interface GoalRecommendation {
  suggestedCalories: number | null;
  suggestedProtein: number | null;
  suggestedCarbs: number | null;
  suggestedFat: number | null;
  reasoning: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    errors?: Record<string, string[]>;
  };
}
