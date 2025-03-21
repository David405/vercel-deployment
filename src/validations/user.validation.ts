import { z } from 'zod';
import { AuthValidation } from './auth.validation';

export class UserValidation {
	static usernameSchema = z.object({
		username: z
			.string()
			.trim()
			.min(3, 'Username must be at least 3 characters long')
			.max(20, 'Username cannot be more than 20 characters long')
			.regex(
				/^[a-zA-Z0-9-_]+$/,
				'Username can only contain letters, numbers, underscore, hyphen'
			)
			.transform((val) => val.toLowerCase())
	});

	static createUserSchema = z
		.object({
			type: z.enum(['turnkey', 'third-party']),
			username: UserValidation.usernameSchema.shape.username,
			email: z
				.string()
				.trim()
				.email(
					'Invalid email format/remove email field in case of empty email for type third-party'
				)
				.optional(),
			bio: z.string().trim().optional(),
			avatar: z.string().trim().optional(),
			account: z.object({
				address: z.string().trim().min(1, 'Address is required'),
				nonce: z.string().trim().min(1, 'Nonce is required'),
				chainId: z.enum(['ethereum', 'solana'])
			})
		})
		.merge(AuthValidation.siweSchema)
		.refine((data) => data.type === 'third-party' || !!data.email, {
			message: "Email is required for 'turnkey' users",
			path: ['email']
		});
}
