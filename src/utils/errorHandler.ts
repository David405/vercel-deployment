import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err.message);
  console.error(err.stack);

  res.status(500).json({
    error: err.message || "Something went wrong!",
  });
};
