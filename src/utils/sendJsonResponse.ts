import { Response } from "express";
import { StatusCodes } from "http-status-codes";

export function sendJsonResponse<T>(
  res: Response,
  status: StatusCodes,
  payload: T
) {
  res.status(status).json({ data: payload });
}
