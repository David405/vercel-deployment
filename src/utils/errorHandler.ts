import { Request, Response, NextFunction } from "express";
import { sendErrorResponse } from "./sendErrorResponse";
import { StatusCodes } from "http-status-codes";
import CustomError from "./error";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err.message);
  console.error(err.stack);

  sendErrorResponse(
    res,
    StatusCodes.INTERNAL_SERVER_ERROR,
    "Something went wrong!",
    err.message
  );
};




