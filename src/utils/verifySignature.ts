import { getAddressFromMessage, getChainIdFromMessage, formatSignature } from '../utils/helpers';
import { createPublicClient, http, type Hex } from 'viem';

export const verifySignature = async (message: string, signature: string): Promise<boolean> => {
	try {
		// Extract address and chainId from the SIWE message
		const extractedAddress = getAddressFromMessage(message);
		const chainId = getChainIdFromMessage(message);

		// Set up public client for verification
		const publicClient = createPublicClient({
			transport: http(
				`https://rpc.walletconnect.org/v1/?chainId=${chainId}&projectId=${process.env.PROJECT_ID}`
			)
		});

		const formattedAddress = `0x${extractedAddress}` as Hex;
		const formattedSignature = formatSignature(signature);

		// Verify the signature
		const isValid = await publicClient.verifyMessage({
			message,
			address: formattedAddress,
			signature: formattedSignature
		});

		return isValid;
	} catch (e) {
		console.error('Signature Verification Error:', e);
		return false;
	}
};
