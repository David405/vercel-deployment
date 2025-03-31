// api/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
// import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import csrf from 'csurf';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { readdirSync } from 'fs';
// import { errorHandler } from '../src/utils/errors/index.ts';

// Load environment variables
dotenv.config();

const app = express();
const client = process.env.CLIENT;

// CORS configuration
const corsOptionsDelegate = (req: Request, callback: (err: Error | null, options?: cors.CorsOptions) => void) => {
  const origin = req.header('Origin');
  const appEnv = process.env.NODE_ENV;

  let allowedOrigin: string | string[] | undefined;

  if (appEnv === "development") {
    allowedOrigin = [`http://localhost:${client}`];
  } else if (appEnv === "staging") {
    allowedOrigin = [`http://localhost:${client}`, "https://bloom-web-server.onrender.com"];
  } else if (appEnv === "production") {
    allowedOrigin = "https://bloom.social";
  }

  const corsOptions: cors.CorsOptions = {
    origin: allowedOrigin,
    credentials: true
  };

  callback(null, corsOptions);
};

// Middleware setup
app.use(cors(corsOptionsDelegate));
app.options('*', cors(corsOptionsDelegate));
app.use(express.json());
app.use(cookieParser());

if (!process.env.SECRET) {
  throw new Error('SECRET environment variable is not defined');
}

app.use(
  session({
    name: 'bloom-web-server',
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production', sameSite: true }
  })
);

// CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60
  }
});

const enableCsrfProtection = process.env.ENABLE_CSRF_PROTECTION === 'true';

app.use((req: Request, res: Response, next: NextFunction) => {
  if (enableCsrfProtection) {
    return csrfProtection(req, res, next);
  }
  next();
});

// Dynamically import routes
readdirSync('../src/routes').forEach(async (file) => {
  if (file.endsWith('.ts')) {
    const route = await import(`./routes/${file}`);
    app.use('/api', route.default);
  }
});

// CSRF token endpoint
app.get('/api/security/csrf-token', (req: Request, res: Response) => {
  if (enableCsrfProtection) {
    return csrfProtection(req, res, () => {
      res.json({ csrfToken: req.csrfToken() });
    });
  } else {
    res.status(403).json({ error: 'CSRF protection is disabled' });
  }
});

// API Health Check
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bloom Web Server is running'
  });
});

// Error handling middleware
// app.use(errorHandler);

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Vercel-Serverless', 'true');

  // Type assertion to bridge VercelRequest to Express Request
  const expressReq = req as unknown as Request;
  const expressRes = res as unknown as Response;

  return new Promise((resolve, reject) => {
    app(expressReq, expressRes, (err: any) => {
      if (err) {
        console.error('Handler error:', err);
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export { app };