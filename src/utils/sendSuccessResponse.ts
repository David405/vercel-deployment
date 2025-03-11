import { Response } from "express";
import { StatusCodes } from "http-status-codes";

export function sendJsonResponse(res: Response, status: StatusCodes, payload: Record<string, unknown>) {
    res.status(status).json({ data: payload })


}