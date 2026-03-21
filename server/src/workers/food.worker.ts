import fs from "node:fs/promises";
import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import connection from "../lib/redis.js";
import { aiService } from "../lib/gemini.js";
import { vectorService } from "../lib/qdrant.js";
import { db } from "../db/index.js";
import { foodLog } from "../db/schema.js";
import { nutritionService } from "../services/nutrition.service.js";
import type { FoodAnalysisResult } from "../types/index.js";
import { logger } from "../utils/logger.js";

function buildFoodSummaryText(result: FoodAnalysisResult, mealType?: string | null, notes?: string | null): string {
  const detected = result.detectedFoods.length
    ? result.detectedFoods
      .map((food) => `${food.name} (${food.estimatedPortion})`)
      .join(", ")
    : "Unknown foods";

  const parts = [
    mealType ? `Meal type: ${mealType}.` : null,
    `Detected foods: ${detected}.`,
    result.totalCalories != null ? `Estimated calories: ${result.totalCalories}.` : null,
    result.notes ? `Analysis notes: ${result.notes}.` : null,
    notes ? `User notes: ${notes}.` : null,
  ].filter(Boolean);

  return parts.join(" ");
}

export const foodWorker = new Worker(
  "food-processing",
  async (job) => {
    const { foodLogId, userId, imagePath, mimeType } = job.data;

    try {
      logger.worker("Processing food log", String(job.id), { foodLogId, userId });

      const imageBuffer = await fs.readFile(imagePath);
      const analysis = await aiService.analyzeFood(imageBuffer, mimeType);

      const [existing] = await db.select().from(foodLog).where(eq(foodLog.id, foodLogId)).limit(1);

      await db
        .update(foodLog)
        .set({
          detectedFoods: analysis.detectedFoods,
          totalCalories: analysis.totalCalories,
          totalProtein: analysis.totalProtein,
          totalCarbs: analysis.totalCarbs,
          totalFat: analysis.totalFat,
          processingError: null,
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(foodLog.id, foodLogId));

      const summaryText = buildFoodSummaryText(analysis, existing?.mealType, existing?.notes);
      const vector = await aiService.generateEmbedding(summaryText);

      await vectorService.upsertPoint(vectorService.LOGS_COLLECTION, foodLogId, vector, {
        text: summaryText,
        userId,
        timestamp: new Date().toISOString(),
        type: "food_log",
        mealType: existing?.mealType ?? null,
        imageUrl: existing?.imageUrl ?? null,
        totalCalories: analysis.totalCalories,
      });

      if (existing) {
        await nutritionService.refreshDailySummaryForDate(
          userId,
          existing.loggedAt.toISOString().split("T")[0],
        );
      }

      return { success: true, detectedFoods: analysis.detectedFoods.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown food processing error";

      logger.error("Failed to process food log", error instanceof Error ? error : undefined, {
        foodLogId,
        userId,
      });

      await db
        .update(foodLog)
        .set({
          status: "failed",
          processingError: message,
          updatedAt: new Date(),
        })
        .where(eq(foodLog.id, foodLogId));

      throw error;
    }
  },
  { connection },
);

foodWorker.on("completed", (job) => {
  logger.worker("Food job completed successfully", String(job.id), {
    foodLogId: job.data.foodLogId,
    userId: job.data.userId,
  });
});

foodWorker.on("failed", (job, err) => {
  logger.error("Food worker job failed", err, {
    jobId: job?.id,
    foodLogId: job?.data?.foodLogId,
    userId: job?.data?.userId,
  });
});
