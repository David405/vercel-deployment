import { NextFunction, Request, Response } from "express";
import { CustomError } from "./custom-error.class";

function sendCustomErrorResponse(res: Response, error: CustomError) {
  return res.status(error.status).json(error.toJSON());
}

export function handleError(res: Response, error: Error | CustomError) {
  console.error("Error:", error.message, error.stack);

  if (error.name !== "CustomError") {
    error = CustomError.InternalServerError(error.message);
  }
  sendCustomErrorResponse(res, error as CustomError);
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  handleError(res, err);
};
