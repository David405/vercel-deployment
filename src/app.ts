import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import csrf from "csurf";
import cookieParser from "cookie-parser";
import { readdirSync } from "fs";
import { errorHandler } from "./utils/errorHandler";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3002;

// CORS configuration
const corsOptionsDelegate = (req: any, callback: any) => {
  const origin = req.header("Origin");
  const appEnv = process.env.NODE_ENV;

  let allowedOrigin;

  if (appEnv === "development") {
    allowedOrigin = `http://localhost:${port}`;
  } else if (appEnv === "staging") {
    allowedOrigin = [`http://localhost:${port}`, "https://staging.bloom.social"];
  } else if (appEnv === "production") {
    allowedOrigin = "https://bloom.social";
  }

  const corsOptions = {
    origin: allowedOrigin,
    credentials: true,
  };

  callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));
app.options("*", cors(corsOptionsDelegate)); // Enable pre-flight requests

// Middleware
app.use(express.json());
app.use(cookieParser());

// CSRF protection
const csrfProtection = csrf({ cookie: true });

// Apply CSRF protection to all routes except those starting with /api
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  return csrfProtection(req, res, next);
});

// Dynamically import routes
readdirSync("./src/routes").forEach(async (file) => {
    if (file.endsWith(".ts")) {
      const route = await import(`./routes/${file}`);
      app.use("/api", route.default); 
    }
  });

// CSRF token endpoint
app.get("/api/security/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// API Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Bloom Web Server is running",
  });
});

// Error handling middleware
app.use(errorHandler);

// Global unhandled rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Start server
app.listen(port, () => {
  console.log(`Bloom server is running on port ${port}`);
});

export { app, prisma };
