import { createWeb3Modal, defaultConfig } from '@web3modal/ethereum';
import { mainnet } from 'viem/chains';

// Define your wallet connect project ID
const projectId = process.env.WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Define Metamask connection manager
export class MetamaskConnector {
  private web3modal;
  private apiBaseUrl: string;

  constructor(apiBaseUrl = 'http://localhost:5000') {
    // Configure web3modal
    this.web3modal = createWeb3Modal({
      ethersConfig: defaultConfig({ 
        metadata: {
          name: 'WhaleTrack GoatAgent',
          description: 'Blockchain operations for WhaleTrack',
          icons: []
        }
      }),
      chains: [mainnet],
      projectId,
      themeVariables: {
        '--w3m-accent': '#3396FF'
      }
    });
    
    this.apiBaseUrl = apiBaseUrl;
  }

  async connect() {
    try {
      // Connect to wallet
      const { walletProvider, address } = await this.web3modal.connect();
      
      // Get chain ID
      const chainId = await walletProvider.request({ method: 'eth_chainId' });
      
      // Notify the API server about the connection
      const response = await fetch(`${this.apiBaseUrl}/api/goat/connect-metamask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: walletProvider,
          address,
          chainId: parseInt(chainId, 16)
        })
      });
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('Error connecting to Metamask:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.web3modal.disconnect();
      return { success: true };
    } catch (error) {
      console.error('Error disconnecting from Metamask:', error);
      throw error;
    }
  }
}

export default MetamaskConnector;
