import fs from "node:fs/promises";
import path from "node:path";
import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { foodLog } from "../db/schema.js";
import { addFoodJob } from "../lib/queue.js";
import { vectorService } from "../lib/qdrant.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { foodUpload } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createFoodLogSchema,
  foodLogIdParamSchema,
  updateFoodLogSchema,
} from "../schemas/food.schema.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { AppError, NotFoundError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export const foodRouter = Router();

function getRouteId(id: string | string[]): string {
  return Array.isArray(id) ? id[0] : id;
}

foodRouter.post(
  "/food",
  requireAuth,
  foodUpload.single("image"),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const parsedBody = createFoodLogSchema.parse(req.body);
      const file = req.file;

      if (!file) {
        throw new AppError("Image is required", 400, "IMAGE_REQUIRED");
      }

      const foodLogId = uuidv4();
      const imageUrl = `/uploads/food/${path.basename(file.path)}`;

      await db.insert(foodLog).values({
        id: foodLogId,
        userId: authReq.user.id,
        imageUrl,
        storagePath: file.path,
        mimeType: file.mimetype,
        originalFilename: file.originalname,
        mealType: parsedBody.mealType,
        notes: parsedBody.notes,
        status: "pending",
      });

      await addFoodJob({
        foodLogId,
        userId: authReq.user.id,
        imagePath: file.path,
        mimeType: file.mimetype,
      });

      logger.info("Queued food log", {
        requestId: authReq.requestId,
        userId: authReq.user.id,
        foodLogId,
      });

      res.status(201).json({
        success: true,
        id: foodLogId,
        status: "queued",
        imageUrl,
      });
    } catch (error) {
      next(error);
    }
  },
);

foodRouter.get("/food", requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const logs = await db
      .select()
      .from(foodLog)
      .where(eq(foodLog.userId, authReq.user.id))
      .orderBy(desc(foodLog.loggedAt));

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
});

foodRouter.get(
  "/food/:id",
  requireAuth,
  validate(foodLogIdParamSchema, "params"),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const foodLogId = getRouteId(req.params.id);
      const [record] = await db
        .select()
        .from(foodLog)
        .where(and(eq(foodLog.id, foodLogId), eq(foodLog.userId, authReq.user.id)))
        .limit(1);

      if (!record) {
        throw new NotFoundError("Food log");
      }

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  },
);

foodRouter.patch(
  "/food/:id",
  requireAuth,
  validate(foodLogIdParamSchema, "params"),
  validate(updateFoodLogSchema),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const foodLogId = getRouteId(req.params.id);
      const [existing] = await db
        .select()
        .from(foodLog)
        .where(and(eq(foodLog.id, foodLogId), eq(foodLog.userId, authReq.user.id)))
        .limit(1);

      if (!existing) {
        throw new NotFoundError("Food log");
      }

      const { correctedData, mealType, notes } = req.body;

      await db
        .update(foodLog)
        .set({
          mealType: mealType ?? existing.mealType,
          notes: notes ?? existing.notes,
          correctedData: correctedData ?? existing.correctedData,
          userCorrected: correctedData ? true : existing.userCorrected,
          detectedFoods: correctedData?.detectedFoods ?? existing.detectedFoods,
          totalCalories: correctedData?.totalCalories ?? existing.totalCalories,
          totalProtein: correctedData?.totalProtein ?? existing.totalProtein,
          totalCarbs: correctedData?.totalCarbs ?? existing.totalCarbs,
          totalFat: correctedData?.totalFat ?? existing.totalFat,
          updatedAt: new Date(),
        })
        .where(eq(foodLog.id, foodLogId));

      const [updated] = await db
        .select()
        .from(foodLog)
        .where(eq(foodLog.id, foodLogId))
        .limit(1);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
);

foodRouter.delete(
  "/food/:id",
  requireAuth,
  validate(foodLogIdParamSchema, "params"),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const foodLogId = getRouteId(req.params.id);
      const [existing] = await db
        .select()
        .from(foodLog)
        .where(and(eq(foodLog.id, foodLogId), eq(foodLog.userId, authReq.user.id)))
        .limit(1);

      if (!existing) {
        throw new NotFoundError("Food log");
      }

      await db.delete(foodLog).where(eq(foodLog.id, foodLogId));

      if (existing.storagePath) {
        await fs.unlink(existing.storagePath).catch(() => undefined);
      }

      await vectorService.deletePoint(vectorService.LOGS_COLLECTION, foodLogId).catch(() => undefined);

      res.json({
        success: true,
        message: "Food log deleted",
      });
    } catch (error) {
      next(error);
    }
  },
);
