import { z } from "zod";

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const createFoodLogSchema = z.object({
  mealType: mealTypeSchema.optional(),
  notes: z.string().trim().max(500).optional(),
});

export const foodLogIdParamSchema = z.object({
  id: z.string().trim().min(1, "Food log id is required"),
});

const correctedFoodSchema = z.object({
  name: z.string().trim().min(1),
  estimatedPortion: z.string().trim().min(1),
  calories: z.number().nullable(),
  protein: z.number().nullable(),
  carbs: z.number().nullable(),
  fat: z.number().nullable(),
  confidence: z.number().nullable(),
});

export const updateFoodLogSchema = z.object({
  mealType: mealTypeSchema.optional(),
  notes: z.string().trim().max(500).optional(),
  correctedData: z.object({
    detectedFoods: z.array(correctedFoodSchema),
    totalCalories: z.number().nullable(),
    totalProtein: z.number().nullable(),
    totalCarbs: z.number().nullable(),
    totalFat: z.number().nullable(),
    notes: z.string().nullable().optional(),
  }).optional(),
});
