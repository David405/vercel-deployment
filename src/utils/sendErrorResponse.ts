import { Response } from "express";
import { getReasonPhrase, StatusCodes } from "http-status-codes";

export function sendErrorResponse(
  res: Response,
  statusCode: StatusCodes,
  message?: string | undefined,
  error?: string | undefined
) {
  return res.status(statusCode).json({
    success: false,
    reason: getReasonPhrase(statusCode),
    message,
    error,
  });
}

export function getErrorDetails(error: unknown) {
  const statusCode = (error as any)?.status || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = error instanceof Error ? error.message : String(error);
  
  return {
    statusCode,
    message,
    stack: error instanceof Error ? error.stack : undefined
  };
}