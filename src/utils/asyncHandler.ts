import { NextFunction, Request, Response } from "express";

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