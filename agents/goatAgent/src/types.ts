import { Address, WalletClient, PublicClient } from 'viem';
import { GoatWallet, ToolBase } from '@goat-sdk/core';
import { z } from 'zod';

/**
 * Token definition containing basic token information
 */
export interface TokenDefinition {
  name: string;
  symbol: string;
  decimals: number;
  chains: {
    [chainId: number]: {
      contractAddress: Address;
    };
  };
  price?: number;
}

/**
 * Token information with price data
 */
export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  price: number;
}

/**
 * Balance information for a token or native currency
 */
export interface BalanceInfo {
  balance: string; // Formatted balance (e.g., from formatEther)
  symbol: string;
  usdValue: string;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  txHash: string;
  result?: string;
}

/**
 * Basic API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  mockData?: T;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
  environment: string;
  tokenCount: number;
}

/**
 * Wallet setup result
 */
export interface WalletSetupResult {
  wallet: GoatWallet; // Specific type from @goat-sdk/core
  walletClient: WalletClient; // Specific type from viem
  publicClient: PublicClient; // Added public client for read operations
  tools: ToolBase<z.ZodTypeAny>[]; // Use ToolBase with Zod schema
  address: Address; // Connected account address
}

/**
 * Metamask connection state
 */
export interface MetamaskConnectionState {
  connected: boolean;
  address?: Address;
  chainId?: number;
  walletClient?: WalletClient;
  publicClient?: PublicClient;
}

/**
 * Available tokens response
 */
export interface TokenListResponse {
  tokens: TokenInfo[];
}

/**
 * Error with additional context
 */
export class BlockchainError extends Error {
  public code?: string;
  public context?: any;

  constructor(message: string, code?: string, context?: any) {
    super(message);
    this.name = 'BlockchainError';
    this.code = code;
    this.context = context;
  }
}