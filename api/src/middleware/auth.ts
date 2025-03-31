import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
	namespace Express {
		interface Request {
			user?: {
				userId: string;
			};
		}
	}
}

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Feature flag: Enable/disable authentication via environment variable
  const isAuthEnabled = process.env.ENABLE_AUTH !== 'false';

  if (!isAuthEnabled) {
 
    req.user = { userId: '8b9429eb-e9ce-429c-bc23-6905e22b4eab' };
    next();
    return;
  }

  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET!) as { userId: string };
    req.user = decoded; // Attach user info to the request object
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

