export interface WhaleTransaction {
    id: string;
    type: 'buy' | 'sell';
    amount: string;
    token: string;
    timestamp: string;
    txHash: string;
    counterparty?: string; // Address of the other party in the transaction
  }