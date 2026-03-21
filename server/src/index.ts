import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import "./workers/log.worker.js";
import { config, validateConfig } from "./config/index.js";
import { vectorService } from "./lib/qdrant.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { logger } from "./utils/logger.js";

const app = express();

app.use(helmet());

app.use(cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
    validateConfig();
    await vectorService.initCollection();

    app.listen(config.port, () => {
        logger.info(`Server running on http://localhost:${config.port}`);
    });
};

startServer();
