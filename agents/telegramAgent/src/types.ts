export interface TelegramMessage {
  id: string;
  channelName: string;
  text: string;
  timestamp: string;
  username: string;
}

export interface SentimentAnalysis {
  buys: number;
  sells: number;
  neutral: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  messages: TelegramMessage[];
  lastUpdated: string;
}

export interface TokenSentiment {
  token: string;
  buys: number;
  sells: number;
  neutral: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  lastUpdate: string;
}
