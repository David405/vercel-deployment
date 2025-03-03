import { type Hex } from 'viem';

// Helper function to extract address from SIWE message
export const getAddressFromMessage = (message: string): string => {
    const messageLines = message.split('\n');
    
    const addressLine = messageLines[1]?.trim();
    if (!addressLine) {
      throw new Error("Address not found in message");
    }
    return addressLine.startsWith('0x') ? addressLine.substring(2) : addressLine;
  };
  
  // Helper function to extract chainId from SIWE message
export const getChainIdFromMessage = (message: string): string => {
    const chainIdMatch = message.match(/Chain ID: ([0-9]+)/);
    if (!chainIdMatch || !chainIdMatch[1]) {
      throw new Error("ChainId not found in message");
    }
    return chainIdMatch[1];
  };
  
  // Ensure signature is a proper hex string
export const formatSignature = (signature: string): Hex => {
    return signature.startsWith('0x') ? signature as Hex : `0x${signature}` as Hex;
  };