class CustomError extends Error {
    status: number;
    reason: string;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.reason = CustomError.getReasonPhrase(status);
        this.name = this.constructor.name;
    
        // Ensure the correct prototype chain
        Object.setPrototypeOf(this, new.target.prototype);
    
        Error.captureStackTrace(this, this.constructor);
    }

    static getReasonPhrase(status: number): string {
        const reasons: { [key: number]: string } = {
            400: "Bad Request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not Found",
            409: "Conflict",
            500: "Internal Server Error",
        };
        return reasons[status] || "Unknown Error";
    }

    toJSON() {
        return {
            success: false,
            reason: this.reason,
            message: this.message,
            error: this.name
        };
    }

    static BadRequest(message = "Bad Request") {
        return new CustomError(message, 400);
    }

    static Unauthorized(message = "Unauthorized") {
        return new CustomError(message, 401);
    }

    static Forbidden(message = "Forbidden") {
        return new CustomError(message, 403);
    }

    static NotFound(message = "Not Found") {
        return new CustomError(message, 404);
    }

    static Conflict(message = "Conflict") {
        return new CustomError(message, 409);
    }

    static InternalServerError(message = "Internal Server Error") {
        return new CustomError(message, 500);
    }
}

export default CustomError;
