import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CreateUserBody, UserService } from "../services/user";
import { asyncHandler } from "../utils/asyncHandler";
import { handleError, CustomError } from "../utils/errors";
import { sendJsonResponse } from "../utils/sendJsonResponse";
import { z, ZodSchema } from "zod";

const usernameRequestSchema = z.object({
  username: z
    .string({
      required_error: "Username is required in request",
    })
    .min(1, "Username is required in request"),
});

const createUserRequestSchema = z.object({
  type: z.enum(["turnkey", "third-party"]),
  username: z.string().min(1, "Username is required in request"),
  email: z.string(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  account: z.object({
    address: z.string(),
    nonce: z.string(),
    chainId: z.string(),
  }),
  message: z.string(),
  signature: z.string(),
});

/**
 * Validates request params based on a Zod schema
 * @param req Express request object
 * @param schema Zod schema for validation
 * @returns Validated data as type T
 */
export function validateRequestBasedOnType<T>(
  req: Request,
  source: "params" | "body" | "query",
  schema: ZodSchema<T>
): void {
  const objectToValidate = req[source];

  const validationResult = schema.safeParse(objectToValidate);

  if (!validationResult.success) {
    throw CustomError.BadRequest(
      "Invalid request parameters",
      validationResult.error.errors[0].message
    );
  }
}

async function customRequestHandler<T>(
  req: Request,
  res: Response,
  successCode: StatusCodes,
  validation:
    | { source: "params" | "body" | "query"; schema: ZodSchema<T> }
    | undefined,
  handlerFunction: (req: Request) => Promise<Record<string, unknown>>
) {
  try {
    if (validation) {
      validateRequestBasedOnType<T>(req, validation.source, validation.schema);
    }

    const result = await handlerFunction(req);

    return sendJsonResponse(res, successCode, result);
  } catch (error) {
    return handleError(res, error as Error | CustomError);
  }
}

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Validates if a username is available
   * @param req Express request object
   * @param res Express response object
   */
  validateUsername = asyncHandler(async (req: Request, res: Response) =>
    customRequestHandler(
      req,
      res,
      StatusCodes.OK,
      { source: "params", schema: usernameRequestSchema },
      async (req) => {
        return await this.userService.validateUsername(req.params.username);
      }
    )
  );

  /**
   * Creates a new user
   * @param req Express request object
   * @param res Express response object
   */
  create = asyncHandler(async (req: Request, res: Response) =>
    customRequestHandler(
      req,
      res,
      StatusCodes.CREATED,
      { source: "body", schema: createUserRequestSchema },
      async (req: Request) => {
        return await this.userService.createUser(req.body as CreateUserBody);
      }
    )
  );

  /**
   * Gets a user profile by username
   * @param req Express request object
   * @param res Express response object
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    customRequestHandler(
      req,
      res,
      StatusCodes.OK,
      { source: "params", schema: usernameRequestSchema },
      async (req: Request) => {
        return await this.userService.getUserProfile(req.params.username);
      }
    );
  });
}
