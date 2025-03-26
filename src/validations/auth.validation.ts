import { z } from "zod";
import { ChainAllowed } from "../services";

export class AuthValidation {
  static accountAddressRequestSchema = z.object({
    address: z.string().trim().min(1, "Address is required"),
    chainId: z.nativeEnum(ChainAllowed),
  });

	static siweSchema = z.object({
		message: z.string().trim().min(1, 'Message is required'),
		signature: z.string().trim().min(1, 'Signature is required')
	});

  static verifyAndLoginSchema = z
    .object({
      address: z.string().trim().min(1, "Address is required"),
      chain: z.nativeEnum(ChainAllowed),
    })
    .merge(AuthValidation.siweSchema);
}
