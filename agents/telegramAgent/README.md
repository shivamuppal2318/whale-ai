# Telegram Sentiment Agent

A service that monitors Telegram channels for cryptocurrency discussions and analyzes market sentiment.

## Features

- Connects to Telegram channels to monitor crypto discussions
- Identifies buy/sell signals in messages
- Calculates sentiment based on message context
- Provides API endpoints for integrating with other services
- Works with WhaleTracker for comprehensive market analysis

## Setup

1. Create a Telegram bot via BotFather and get your bot token
2. Add the bot to the Telegram channels you want to monitor
3. Set up the `.env` file with your Telegram bot token and OpenAI API key
4. Install dependencies with `npm install`
5. Start the server with `npm start`

## API Endpoints

- `GET /api/telegram/sentiment`: Get sentiment data for all monitored tokens
- `GET /api/telegram/sentiment/:token`: Get sentiment data for a specific token
- `GET /api/telegram/messages`: Get recent messages from monitored channels
- `POST /api/telegram/analyze`: Manually trigger sentiment analysis for a specific token

## Integration with WhaleTracker

This agent provides sentiment data that complements WhaleTracker's whale transaction monitoring.
Together, they provide a comprehensive view of market activity by combining:

1. Large wallet activity (WhaleTracker)
2. Community sentiment (Telegram Agent)

## Environment Variables

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
AGENT_PORT=8032
NGROK_AUTH_TOKEN=auth token
TELEGRAM_CHANNELS=arbiscan_alerts,arbitrum,layer2news
```
