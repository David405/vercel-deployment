import { ZodSchema } from "zod";
import { CustomError } from "./errors";

export function validateObjectOrThrowError(
  objectToValidate: Record<string, unknown>,
  schema: ZodSchema<unknown>,
  errorMessage: string
): void {
  const validationResult = schema.safeParse(objectToValidate);

  if (!validationResult.success) {
    throw CustomError.BadRequest(
      errorMessage,
      validationResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ")
    );
  }
}
