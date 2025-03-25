import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { CustomError, handleError } from "./errors";
import { StatusCodes } from "http-status-codes";
import { sendJsonResponse } from "./sendJsonResponse";
import { validateObjectOrThrowError } from "./validateObject";

/**
 * Async handler for Express routes.
 *
 * This function takes a function (fn) and returns a new function that
 * catches any errors thrown by fn and passes them to the next middleware.
 *  /** */

export const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export function validateRequestBasedOnType<T>(
  req: Request,
  source: "params" | "body" | "query",
  schema: ZodSchema<T>
): void {
  validateObjectOrThrowError(req[source], schema, `Invalid request ${source}`);
}

export async function customRequestHandler<T, R>(
  req: Request,
  res: Response,
  successCode: StatusCodes,
  validation:
    | {
        paramSchema?: ZodSchema<T>;
        bodySchema?: ZodSchema<T>;
        querySchema?: ZodSchema<T>;
      }
    | undefined,
  handlerFunction: (req: Request) => Promise<R>
) {
  try {
    if (validation?.paramSchema) {
      validateRequestBasedOnType<T>(req, "params", validation.paramSchema);
    }

    if (validation?.bodySchema) {
      validateRequestBasedOnType<T>(req, "body", validation.bodySchema);
    }

    if (validation?.querySchema) {
      validateRequestBasedOnType<T>(req, "query", validation.querySchema);
    }

    const result = await handlerFunction(req);

    return sendJsonResponse(res, successCode, result);
  } catch (error) {
    return handleError(res, error as Error | CustomError);
  }
}
