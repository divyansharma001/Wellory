import { Router } from "express";
import { addLogJob } from "../lib/queue.js";
import { aiService } from "../lib/gemini.js";
import { chatRouter } from "./chat.routes.js";
import { foodRouter } from "./food.routes.js";
import { goalsRouter } from "./goals.routes.js";
import { logsRouter } from "./logs.routes.js";
import { AIServiceError } from "../utils/errors.js";

export const apiRouter = Router();

apiRouter.use(logsRouter);
apiRouter.use(chatRouter);
apiRouter.use(foodRouter);
apiRouter.use(goalsRouter);

apiRouter.post("/test-queue", async (req, res, next) => {
  try {
    const { text } = req.body;

    await addLogJob({
      userId: "test-user",
      text: text || "Test log entry",
      logId: "test-id",
    });

    res.json({ status: "queued", message: "Job added to queue" });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/test-ai", async (req, res, next) => {
  try {
    const { text } = req.body;
    const vector = await aiService.generateEmbedding(text);
    const chatResponse = await aiService.generateResponse(`Summarize this in 5 words: ${text}`);

    res.json({
      status: "success",
      vectorSize: vector.length,
      aiResponse: chatResponse,
    });
  } catch (error) {
    next(new AIServiceError("AI Service failed"));
  }
});
