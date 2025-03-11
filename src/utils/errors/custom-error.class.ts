import { StatusCodes, getReasonPhrase } from "http-status-codes";

export interface ICustomError {
  status: StatusCodes,
  reason: string
  message?: string
  cause?: string
}

export class CustomError extends Error implements ICustomError {
  status: StatusCodes;
  reason: string;
  cause?: string;

  constructor(status: StatusCodes, message?: string, cause?: string) {
    super(message);
    this.name = "CustomError";
    this.status = status;
    this.reason = getReasonPhrase(status);
    this.cause = cause;

    // Ensure the correct prototype chain
    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      status: this.status,
      reason: this.reason,
      message: this.message,
      cause: this.cause,
    };
  }
  static BadRequest(message?: string, cause?: string) {
    return new CustomError(StatusCodes.BAD_REQUEST, message, cause);
  }
  
  static Unauthorized(message?: string, cause?: string) {
    return new CustomError(StatusCodes.UNAUTHORIZED, message, cause);
  }
  
  static Forbidden(message?: string, cause?: string) {
    return new CustomError(StatusCodes.FORBIDDEN, message, cause);
  }
  
  static NotFound(message?: string, cause?: string) {
    return new CustomError(StatusCodes.NOT_FOUND, message, cause);
  }
  
  static Conflict(message?: string, cause?: string) {
    return new CustomError(StatusCodes.CONFLICT, message, cause);
  }
  
  static InternalServerError(message?: string, cause?: string) {
    return new CustomError(StatusCodes.INTERNAL_SERVER_ERROR, message, cause);
  }
}
