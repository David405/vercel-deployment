import 'express-session';

declare module 'express-session' {
	export interface SessionData {
		siwe?: {
			address: string;
			chainId: string;
		};
	}
}
