import { z } from "zod";

export class AuthValidation {
  static accountAddressRequestSchema = z.object({
    address: z.string().trim().min(1, "Address is required"),
    chainId: z.enum(["ethereum", "solana"]),
  });

  static verifyAndLoginSchema = z.object({
    address: z.string().trim().min(1, "Address is required"),
    chain: z.enum(["ethereum", "solana"]),
    message: z.string().trim().min(1, "Message is required"),
    signature: z.string().trim().min(1, "Signature is required"),
  });
}
