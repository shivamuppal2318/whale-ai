import express from 'express';
import cors from 'cors';
import ngrok from 'ngrok';
import { getTools } from '@goat-sdk/core';
import { erc20, USDC } from '@goat-sdk/plugin-erc20';
import { sendETH } from '@goat-sdk/wallet-evm';
import { viem } from '@goat-sdk/wallet-viem';
import { 
  createPublicClient, createWalletClient, 
  http, parseEther, formatEther, 
  custom, getAddress, type Address 
} from 'viem';
import { mainnet } from 'viem/chains';
import {
  ApiResponse,
  BalanceInfo,
  HealthCheckResponse,
  TokenDefinition,
  TokenInfo,
  TokenListResponse,
  TransactionResult,
  WalletSetupResult,
  BlockchainError,
  MetamaskConnectionState
} from './types';

// Initialize Express
const app = express();
app.use(express.json());
app.use(cors());

// Environment variables with fallbacks
const EXPRESS_PORT = parseInt(process.env.PORT || '5000');

// Token definitions
const tokens: TokenDefinition[] = [
  USDC,
  {
    name: 'OpenServ',
    symbol: 'SERV',
    decimals: 18,
    chains: {
      [mainnet.id]: {
        contractAddress: '0x40e3d1A4B2C47d9AA61261F5606136ef73E28042',
      },
    },
  },
  {
    name: 'Virtual Protocol',
    symbol: 'VIRTUAL',
    decimals: 18,
    chains: {
      [mainnet.id]: {
        contractAddress: '0x44ff8620b8cA30902395A7bD3F2407e1A091BF73',
      },
    },
  },
];

// Mock prices for USD value calculation
const tokenPrices: Record<string, number> = {
  ETH: 3500,
  USDC: 1.0,
  SERV: 2.5,
  VIRTUAL: 0.75,
};

// Global metamask connection state
let metamaskState: MetamaskConnectionState = {
  connected: false
};

// Metamask connection handler
app.post('/api/goat/connect-metamask', async (req, res: express.Response<ApiResponse<MetamaskConnectionState>>) => {
  try {
    const { provider, address, chainId } = req.body;
    
    if (!provider || !address || !chainId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required connection parameters',
        mockData: { connected: false }
      });
    }

    // Create wallet client using the injected provider
    const walletClient = createWalletClient({
      transport: custom(provider),
      chain: mainnet,
    });

    // Create public client for read operations
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(process.env.RPC_PROVIDER_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo')
    });

    // Update global metamask state
    metamaskState = {
      connected: true,
      address: address as Address,
      chainId,
      walletClient,
      publicClient
    };

    res.json({
      success: true,
      data: {
        connected: true,
        address: address as Address,
        chainId
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error connecting to Metamask:', errorMessage);
    res.status(500).json({
      success: false,
      error: errorMessage,
      mockData: { connected: false }
    });
  }
});

// Setup wallet from metamask state
async function setupWalletFromMetamask(): Promise<WalletSetupResult> {
  try {
    if (!metamaskState.connected || !metamaskState.walletClient || !metamaskState.address) {
      throw new BlockchainError('Metamask not connected. Connect Metamask first.');
    }

    const walletClient = metamaskState.walletClient;
    const publicClient = metamaskState.publicClient!;
    const wallet = viem(walletClient);

    const erc20Plugin = erc20({ tokens });
    const tools = await getTools({
      wallet,
      plugins: [sendETH(), erc20Plugin],
    });

    return { 
      wallet, 
      walletClient, 
      publicClient,
      tools,
      address: metamaskState.address 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error setting up wallet from Metamask:', errorMessage);
    throw new BlockchainError(`Failed to use Metamask wallet: ${errorMessage}`);
  }
}

// Get wallet balance
app.get('/api/goat/balance', async (req, res: express.Response<ApiResponse<BalanceInfo>>) => {
  try {
    if (!metamaskState.connected) {
      return res.status(400).json({
        success: false,
        error: 'Metamask not connected. Connect Metamask first.',
        mockData: { balance: '100.00', symbol: 'ETH', usdValue: '350000.00' },
      });
    }

    const { wallet, address } = await setupWalletFromMetamask();
    const balance = await wallet.balanceOf(address);

    const usdValue = (parseFloat(formatEther(balance)) * tokenPrices.ETH).toFixed(2);

    res.json({
      success: true,
      data: {
        balance: formatEther(balance),
        symbol: 'ETH',
        usdValue,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error getting balance:', errorMessage);
    res.status(500).json({
      success: false,
      error: errorMessage,
      mockData: { balance: '100.00', symbol: 'ETH', usdValue: '350000.00' },
    });
  }
});

// Get token balance
app.get('/api/goat/token-balance/:token', async (req, res: express.Response<ApiResponse<BalanceInfo>>) => {
  try {
    const token = req.params.token || 'USDC';

    if (!metamaskState.connected) {
      return res.status(400).json({
        success: false,
        error: 'Metamask not connected. Connect Metamask first.',
        mockData: { balance: '1000.00', symbol: token, usdValue: '1000.00' },
      });
    }

    const validTokens = ['ETH', 'USDC', 'SERV', 'VIRTUAL'];
    if (!validTokens.includes(token)) {
      return res.status(400).json({
        success: false,
        error: `Invalid token. Must be one of: ${validTokens.join(', ')}`,
        mockData: { balance: '1000.00', symbol: 'USDC', usdValue: '1000.00' },
      });
    }

    const { wallet, tools, address } = await setupWalletFromMetamask();

    const getTokenBalanceTool = tools.find((t) => t.name === 'get_token_balance');
    if (!getTokenBalanceTool) {
      throw new BlockchainError('Token balance tool not available');
    }

    const result = await getTokenBalanceTool.execute({ token, wallet: address });
    const balance = typeof result === 'string' ? result.split(' ')[0] : String(result);
    const usdValue = (parseFloat(balance) * (tokenPrices[token] || 0)).toFixed(2);

    res.json({
      success: true,
      data: {
        balance,
        symbol: token,
        usdValue,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error getting token balance:', errorMessage);
    const token = req.params.token || 'USDC';
    res.status(500).json({
      success: false,
      error: errorMessage,
      mockData: { balance: '1000.00', symbol: token, usdValue: '1000.00' },
    });
  }
});

// Send ETH
app.post('/api/goat/send-eth', async (req, res: express.Response<ApiResponse<TransactionResult>>) => {
  try {
    const { to, amount } = req.body as { to?: string; amount?: string };

    if (!metamaskState.connected) {
      return res.status(400).json({
        success: false,
        error: 'Metamask not connected. Connect Metamask first.',
        mockData: { txHash: '0x' + Math.random().toString(36).substring(2, 15) },
      });
    }

    if (!to || typeof to !== 'string' || !to.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient address. Must be a hexadecimal string starting with 0x',
        mockData: { txHash: '0x' + Math.random().toString(36).substring(2, 15) },
      });
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number',
        mockData: { txHash: '0x' + Math.random().toString(36).substring(2, 15) },
      });
    }

    const { walletClient } = await setupWalletFromMetamask();
    const tx = await walletClient.sendTransaction({
      to: to as `0x${string}`,
      value: parseEther(amount),
    });

    res.json({
      success: true,
      data: { txHash: tx },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error sending ETH:', errorMessage);
    res.status(500).json({
      success: false,
      error: errorMessage,
      mockData: { txHash: '0x' + Math.random().toString(36).substring(2, 15) },
    });
  }
});

// Transfer token
app.post('/api/goat/transfer-token', async (req, res: express.Response<ApiResponse<TransactionResult>>) => {
  try {
    const { token, to, amount } = req.body as {
      token?: string;
      to?: string;
      amount?: string;
    };

    if (!metamaskState.connected) {
      return res.status(400).json({
        success: false,
        error: 'Metamask not connected. Connect Metamask first.',
        mockData: { txHash: '0x' + Math.random().toString(36).substring(2, 15) },
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token symbol is required',
        mockData: { txHash: '0x' + Math.random().toString(36).substring(2, 15) },
      });
    }

    if (!to || typeof to !== 'string' || !to.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient address. Must be a hexadecimal string starting with 0x',
        mockData: { txHash: '0x' + Math.random().toString(36).substring(2, 15) },
      });
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number',
        mockData: { txHash: '0x' + Math.random().toString(36).substring(2, 15) },
      });
    }

    const { tools } = await setupWalletFromMetamask();
    const transferTool = tools.find((t) => t.name === 'transfer_token');
    if (!transferTool) {
      throw new BlockchainError('Transfer token tool not available');
    }

    const result = await transferTool.execute({ token, to, amount });
    const txHashMatch = typeof result === 'string' ? result.match(/0x[a-fA-F0-9]{64}/) : null;
    const txHash = txHashMatch && txHashMatch[0] ? txHashMatch[0] : '0x' + Math.random().toString(36).substring(2, 30);

    res.json({
      success: true,
      data: { txHash, result: String(result) },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error transferring token:', errorMessage);
    res.status(500).json({
      success: false,
      error: errorMessage,
      mockData: { txHash: '0x' + Math.random().toString(36).substring(2, 15) },
    });
  }
});

// List available tokens
app.get('/api/goat/tokens', (req, res: express.Response<ApiResponse<TokenListResponse>>) => {
  try {
    const tokenList: TokenInfo[] = tokens.map((token) => ({
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      price: tokenPrices[token.symbol] || 0,
    }));

    tokenList.unshift({
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      price: tokenPrices.ETH || 0,
    });

    res.json({
      success: true,
      data: { tokens: tokenList },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error listing tokens:', errorMessage);
    res.status(500).json({
      success: false,
      error: errorMessage,
      mockData: {
        tokens: [
          { symbol: 'ETH', name: 'Ethereum', decimals: 18, price: 3500 },
          { symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1 },
          { symbol: 'SERV', name: 'OpenServ', decimals: 18, price: 2.5 },
          { symbol: 'VIRTUAL', name: 'Virtual Protocol', decimals: 18, price: 0.75 },
        ],
      },
    });
  }
});

// Health check endpoint
app.get('/health', (_, res: express.Response<HealthCheckResponse>) => {
  const healthInfo: HealthCheckResponse = {
    status: 'ok',
    service: 'GoatAgent API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    tokenCount: tokens.length + 1, // +1 for ETH
  };
  res.json(healthInfo);
});

// Get connection status
app.get('/api/goat/connection-status', (req, res: express.Response<ApiResponse<MetamaskConnectionState>>) => {
  res.json({
    success: true,
    data: {
      connected: metamaskState.connected,
      address: metamaskState.address,
      chainId: metamaskState.chainId
    }
  });
});

// Start the server
export async function startGoatApiServer(): Promise<express.Express> {
  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(EXPRESS_PORT, async () => {
        console.log(`GoatAgent API running on port ${EXPRESS_PORT}`);

        if (process.env.NGROK_AUTH_TOKEN) {
          try {
            const url = await ngrok.connect({
              addr: EXPRESS_PORT,
              authtoken: process.env.NGROK_AUTH_TOKEN,
            });
            console.log(`GoatAgent API is publicly accessible at: ${url}`);
          } catch (error) {
            console.error('Failed to start ngrok tunnel:', error);
          }
        } else {
          console.log('No NGROK_AUTH_TOKEN provided, skipping tunnel creation');
        }

        resolve(app);
      });

      server.on('error', (error) => {
        console.error('Error starting GoatAgent API server:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Error in startGoatApiServer:', error);
      reject(error);
    }
  });
}

export default app;