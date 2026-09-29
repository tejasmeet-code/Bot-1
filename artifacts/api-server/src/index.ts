import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

// Load .env dynamically if it exists
const envPath = path.resolve(process.cwd(), "../../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Try root relative to the compiled dist if cwd is different
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const fallbackPath = path.resolve(__dirname, "../../../../.env");
  if (fs.existsSync(fallbackPath)) {
    dotenv.config({ path: fallbackPath });
  } else {
    // Also try checking the immediate cwd just in case
    dotenv.config();
  }
}

import express from "express";
import app from "./app";
import { logger } from "./lib/logger";
import { startDiscordBot } from "./discord/client";
import { getDashboardHtml } from "./dashboardView";

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Rejection");
});

const distPath = path.resolve(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.get(["/health", "/healthz", "/_health"], (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get(["/", "/dashboard", "/admin", "/panel", "/dashboard.html"], (req, res) => {
  if (req.headers.accept?.includes("text/plain")) {
    res.send("Bot is online and healthy!");
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(getDashboardHtml());
});

// Parse port from environment variable, fallback to 3000
const port = parseInt(process.env.PORT || "3000", 10);

const server = app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "HTTP server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Express server error");
});

// Discord bot client is disabled on this instance because it is hosted elsewhere.
// Set START_DISCORD_BOT="true" in the environment if you ever need to run the bot instance here.
if (process.env.START_DISCORD_BOT === "true") {
  startDiscordBot().catch((err) => {
    logger.error({ err }, "Discord bot failed to start — check DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID");
  });
} else {
  logger.info("Main Discord bot hosting is disabled on this instance (hosted elsewhere).");
}
