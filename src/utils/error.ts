import { StatusCodes, getReasonPhrase } from "http-status-codes";

class CustomError extends Error {
  status: number;
  reason: string;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.reason = getReasonPhrase(status);
    this.name = this.constructor.name;

    // Ensure the correct prototype chain
    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      reason: this.reason,
      message: this.message,
      error: this.name,
    };
  }
  static BadRequest(message?: string) {
    return new CustomError(message ?? getReasonPhrase(StatusCodes.BAD_REQUEST), StatusCodes.BAD_REQUEST);
  }
  
  static Unauthorized(message?: string) {
    return new CustomError(message ?? getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED);
  }
  
  static Forbidden(message?: string) {
    return new CustomError(message ?? getReasonPhrase(StatusCodes.FORBIDDEN), StatusCodes.FORBIDDEN);
  }
  
  static NotFound(message?: string) {
    return new CustomError(message ?? getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND);
  }
  
  static Conflict(message?: string) {
    return new CustomError(message ?? getReasonPhrase(StatusCodes.CONFLICT), StatusCodes.CONFLICT);
  }
  
  static InternalServerError(message?: string) {
    return new CustomError(message ?? getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR), StatusCodes.INTERNAL_SERVER_ERROR);
  }
  
}

export default CustomError;
