import 'dotenv/config';
import { Agent } from '@openserv-labs/sdk';
import { z } from 'zod';
import express from 'express';
import cors from 'cors';
import ngrok from 'ngrok';
import fs from 'fs';
import path from 'path';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { OpenAI } from 'openai';
import { SentimentAnalysis, TelegramMessage, TokenSentiment } from './types';

// Configuration
const EXPRESS_PORT = parseInt(process.env.PORT || '3001');
const AGENT_PORT = parseInt(process.env.AGENT_PORT || '8032');
const DATA_DIR = path.join(__dirname, '../data');
const SENTIMENT_FILE = path.join(DATA_DIR, 'sentiment_data.json');
const TELEGRAM_CHANNELS = (process.env.TELEGRAM_CHANNELS || '')
  .split(',')
  .map(channel => channel.trim())
  .filter(Boolean);

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Express server
const app = express();
app.use(express.json());
app.use(cors());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize the TelegramSentimentAI Agent
const telegramSentimentAgent = new Agent({
  systemPrompt:
    'You are TelegramSentimentAI, an assistant that monitors and analyzes cryptocurrency-related messages from Telegram channels. You identify market sentiment, count buy/sell signals, and provide analysis on token discussions.',
  port: AGENT_PORT,
});

// Store for the latest messages and sentiment data
const tokenSentiments: Record<string, TokenSentiment> = {};
const recentMessages: TelegramMessage[] = [];
const MAX_MESSAGES = 100;

// Default tokens to monitor
const DEFAULT_TOKENS = ['ETH', 'BTC', 'ARB', 'SOL', 'AVAX'];

// Define the agent's capability
const analyzeSentimentCapability = {
  name: 'analyzeTelegramSentiment',
  description: 'Analyzes sentiment from Telegram channels about specific crypto tokens.',
  schema: z.object({
    token: z.string().optional().default('ARB').describe('The token to analyze sentiment for'),
  }),
  async run({ args }: { args: { token: string } }) {
    try {
      const token = args.token.toUpperCase();
      
      // If we have cached sentiment data, return it
      if (tokenSentiments[token]) {
        return JSON.stringify(tokenSentiments[token], null, 2);
      }
      
      // If we don't have data for this token, generate mock data
      // In a real implementation, you would analyze the messages
      const mockSentiment = generateMockSentiment(token);
      tokenSentiments[token] = mockSentiment;
      
      return JSON.stringify(mockSentiment, null, 2);
    } catch (error) {
      console.error('Error in analyzeTelegramSentiment:', error);
      return JSON.stringify(
        generateMockSentiment(args.token.toUpperCase()),
        null, 2
      );
    }
  },
};

// Add capability to the agent
telegramSentimentAgent.addCapability(analyzeSentimentCapability);

// Function to generate mock sentiment data
function generateMockSentiment(token: string): TokenSentiment {
  const buys = Math.floor(Math.random() * 10) + 5;
  const sells = Math.floor(Math.random() * 7) + 1;
  const neutral = Math.floor(Math.random() * 5) + 3;
  
  let sentiment: 'positive' | 'negative' | 'neutral';
  const ratio = buys / (buys + sells);
  if (ratio > 0.6) sentiment = 'positive';
  else if (ratio < 0.4) sentiment = 'negative';
  else sentiment = 'neutral';
  
  return {
    token,
    buys,
    sells,
    neutral,
    sentiment,
    lastUpdate: new Date().toISOString()
  };
}

// Function to save sentiment data to file
function saveSentimentData() {
  try {
    fs.writeFileSync(SENTIMENT_FILE, JSON.stringify({
      tokens: tokenSentiments,
      messages: recentMessages.slice(-20), // Save only last 20 messages
      lastUpdated: new Date().toISOString()
    }, null, 2));
    console.log(`Sentiment data saved to ${SENTIMENT_FILE}`);
  } catch (error) {
    console.error('Error saving sentiment data:', error);
  }
}

// Initialize Telegram bot (if token exists)
let bot: Telegraf | null = null;

if (process.env.TELEGRAM_BOT_TOKEN) {
  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  
  // Listen for messages
  bot.on(message('text'), async (ctx) => {
    try {
      const msg = ctx.message;
      const chatTitle = (ctx.chat.type !== 'private') 
        ? ctx.chat.title || 'Unknown' 
        : 'Private';
        
      const telegramMessage: TelegramMessage = {
        id: `${msg.message_id}`,
        channelName: chatTitle,
        text: msg.text,
        timestamp: new Date(msg.date * 1000).toISOString(),
        username: msg.from.username || 'anonymous'
      };
      
      // Add message to recent messages
      recentMessages.unshift(telegramMessage);
      if (recentMessages.length > MAX_MESSAGES) {
        recentMessages.pop();
      }
      
      // Check for token mentions and update sentiment
      for (const token of DEFAULT_TOKENS) {
        if (msg.text.toUpperCase().includes(token)) {
          // In a real implementation, you'd use AI to analyze sentiment
          // Here we'll just do a simple pattern matching
          const text = msg.text.toLowerCase();
          
          if (!tokenSentiments[token]) {
            tokenSentiments[token] = {
              token,
              buys: 0,
              sells: 0, 
              neutral: 0,
              sentiment: 'neutral',
              lastUpdate: new Date().toISOString()
            };
          }
          
          // Very basic sentiment detection
          if (text.includes('buy') || text.includes('bullish') || text.includes('moon')) {
            tokenSentiments[token].buys++;
          } else if (text.includes('sell') || text.includes('bearish') || text.includes('dump')) {
            tokenSentiments[token].sells++;
          } else {
            tokenSentiments[token].neutral++;
          }
          
          // Update overall sentiment
          const { buys, sells } = tokenSentiments[token];
          const ratio = buys / (buys + sells || 1);  // Avoid division by zero
          
          if (ratio > 0.6) tokenSentiments[token].sentiment = 'positive';
          else if (ratio < 0.4) tokenSentiments[token].sentiment = 'negative';
          else tokenSentiments[token].sentiment = 'neutral';
          
          tokenSentiments[token].lastUpdate = new Date().toISOString();
          
          console.log(`Updated sentiment for ${token}: ${tokenSentiments[token].sentiment}`);
        }
      }
      
      // Save updated data
      saveSentimentData();
      
    } catch (error) {
      console.error('Error processing Telegram message:', error);
    }
  });
  
  // Start the bot
  bot.launch()
    .then(() => console.log('Telegram bot started'))
    .catch(err => console.error('Failed to start Telegram bot:', err));
    
  // Enable graceful stop
  process.once('SIGINT', () => bot?.stop('SIGINT'));
  process.once('SIGTERM', () => bot?.stop('SIGTERM'));
} else {
  console.log('No Telegram bot token provided, running in mock mode');
  // Generate initial mock data for each token
  DEFAULT_TOKENS.forEach(token => {
    tokenSentiments[token] = generateMockSentiment(token);
  });
}

// API Routes
// Get sentiment for all tokens
app.get('/api/telegram/sentiment', (req, res) => {
  res.json({ tokens: tokenSentiments, lastUpdated: new Date().toISOString() });
});

// Get sentiment for a specific token
app.get('/api/telegram/sentiment/:token', (req, res) => {
  const token = req.params.token.toUpperCase();
  
  if (!tokenSentiments[token]) {
    // Generate mock data if we don't have real data
    tokenSentiments[token] = generateMockSentiment(token);
  }
  
  res.json(tokenSentiments[token]);
});

// Get recent messages
app.get('/api/telegram/messages', (req, res) => {
  res.json({
    messages: recentMessages,
    count: recentMessages.length,
    lastUpdated: new Date().toISOString()
  });
});

// Run sentiment analysis manually (useful for testing)
app.post('/api/telegram/analyze', async (req, res) => {
  try {
    const { token = 'ARB' } = req.body;
    const result = await analyzeSentimentCapability.run({ args: { token } });
    res.json(JSON.parse(result));
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// Periodically update sentiment data (similar to polling in WhaleTracker)
function updateSentimentData() {
  try {
    // In a real implementation, this would analyze recent messages
    // For now, we'll just update mock data
    DEFAULT_TOKENS.forEach(token => {
      // Only update if we don't have real data from Telegram
      if (!bot || !tokenSentiments[token]) {
        tokenSentiments[token] = generateMockSentiment(token);
      } else {
        // If we have existing data, just make small adjustments
        const current = tokenSentiments[token];
        current.buys += Math.floor(Math.random() * 3);
        current.sells += Math.floor(Math.random() * 2);
        current.lastUpdate = new Date().toISOString();
        
        // Update sentiment
        const ratio = current.buys / (current.buys + current.sells);
        if (ratio > 0.6) current.sentiment = 'positive';
        else if (ratio < 0.4) current.sentiment = 'negative';
        else current.sentiment = 'neutral';
      }
    });
    
    console.log('Sentiment data updated');
    saveSentimentData();
  } catch (error) {
    console.error('Error updating sentiment data:', error);
  }
}

// Start the server and expose it via ngrok
async function startServer() {
  try {
    // Start the agent
    telegramSentimentAgent.start();
    
    // Start Express server
    startExpressServer(EXPRESS_PORT);
    
    // Schedule periodic updates
    setInterval(updateSentimentData, 30000); // Every 30 seconds
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

// Function to start Express with automatic port fallback
function startExpressServer(port: number, retries = 3) {
  const server = app.listen(port)
    .on('listening', async () => {
      console.log(`TelegramSentimentAI server running on port ${port}`);
      
      try {
        // Start ngrok tunnel
        const url = await ngrok.connect({
          addr: port,
          authtoken: process.env.NGROK_AUTH_TOKEN
        });
        
        console.log(`TelegramSentimentAI is publicly accessible at: ${url}`);
        console.log(`API Endpoint: ${url}/api/telegram/sentiment`);
      } catch (error) {
        console.error('Failed to start ngrok tunnel:', error);
      }
    })
    .on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying port ${port + 1}...`);
        if (retries > 0) {
          server.close();
          startExpressServer(port + 1, retries - 1);
        } else {
          console.error('Could not find an available port after several attempts');
        }
      } else {
        console.error('Express server error:', error);
      }
    });
}

// Generate initial data on startup
updateSentimentData();

// Start the server
startServer();
