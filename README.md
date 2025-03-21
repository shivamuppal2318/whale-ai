# WhaleTrack: Advanced Crypto Market Intelligence Platform

![WhaleTrack Logo](assets/logo.png)

WhaleTrack is a cutting-edge cryptocurrency market intelligence platform that monitors large-scale wallet transactions ("whale movements") and analyzes market sentiment from social media sources. By seamlessly integrating on-chain data with social signals, WhaleTrack equips traders and investors with actionable insights into market trends and dynamics.

## 🚀 Key Features

- **Whale Transaction Monitoring**: Track substantial cryptocurrency transfers across multiple blockchains.
- **Real-time Sentiment Analysis**: Analyze discussions from Telegram and other social media to gauge market sentiment.
- **Multi-chain Compatibility**: Supports Ethereum, Arbitrum, Solana, and other major blockchain networks.
- **Intelligent Alerts**: Receive notifications for significant market events and whale movements.
- **Interactive Dashboard**: Visualize whale activities and sentiment trends through a dynamic web interface.
- **Comprehensive API Access**: Integrate WhaleTrack data seamlessly into trading algorithms and analytics platforms.
- **Historical Data Analysis**: Study whale behavior patterns and market correlations over time.

## 🏗️ System Architecture

WhaleTrack employs a modular, agent-based architecture powered by the **OpenServ SDK**, where each component specializes in processing specific data sources:

```
WhaleTrack/
├── Core Service - Manages data flow and API access
├── Web Dashboard - User interface for visualization and configuration
└── Agents/
    ├── whaleAgent - Tracks large wallet transactions across blockchains
    ├── telegramAgent - Analyzes crypto sentiment on Telegram
    ├── twitterAgent - Processes discussions from Twitter
    └── newsAgent - Aggregates relevant news from crypto publications
```

## 🛠️ Technology Stack

### Built on OpenServ SDK
WhaleTrack is developed using **OpenServ SDK**, an advanced framework for autonomous AI agents. Key capabilities include:

- **AI-powered analytics** leveraging large language models (LLMs) for sentiment analysis.
- **Scalable, modular architecture** enabling independent and specialized agents.
- **Seamless API integration** ensuring smooth data flow between components.
- **Distributed deployment** for optimal performance and reliability.

## 📋 System Requirements

- **Node.js** (v16+)
- **MongoDB** (v4.4+)
- **Redis** (for caching and pub/sub messaging)
- **OpenServ SDK** (`@openserv-labs/sdk`)
- **API Keys** (Etherscan, Telegram, OpenAI, etc.)

## 🚀 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/WhaleTrack.git
cd WhaleTrack
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your API keys and database configurations
```

### 4️⃣ Start Services
```bash
# Launch the core service
npm run start:core

# Start agents (each in a separate terminal session)
npm run start:whale-agent
npm run start:telegram-agent
npm run start:twitter-agent

# Launch the web dashboard
npm run start:dashboard
```

## 🔧 Configuration Guide

### Core Service
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/whaletrack
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

### Agent-Specific Configuration

#### Telegram Sentiment Agent
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key
AGENT_PORT=8032
NGROK_AUTH_TOKEN=your_ngrok_auth_token
TELEGRAM_CHANNELS=arbiscan_alerts,arbitrum,layer2news
```

#### Whale Transaction Agent
```
ETHERSCAN_API_KEY=your_etherscan_api_key
ARBITRUM_API_KEY=your_arbitrum_api_key
MINIMUM_TX_VALUE=100000
AGENT_PORT=8031
```

## 📊 API Reference

WhaleTrack provides a comprehensive REST API for accessing whale transaction data, sentiment insights, and alert configurations.

### Core API Endpoints
- `GET /api/whales/transactions` - Retrieve recent whale transactions.
- `GET /api/whales/wallets/:address` - Fetch details on specific whale wallets.
- `GET /api/sentiment/overview` - Get an aggregated sentiment analysis of the market.
- `GET /api/alerts` - Access the latest market alerts.

### Telegram Sentiment API
- `GET /api/telegram/sentiment` - Retrieve sentiment analysis for all monitored tokens.
- `GET /api/telegram/sentiment/:token` - Retrieve sentiment analysis for a specific token.
- `GET /api/telegram/messages` - Fetch recent messages from monitored channels.
- `POST /api/telegram/analyze` - Manually trigger sentiment analysis.

### Whale Transaction API
- `GET /api/whales/recent` - Retrieve a list of recent whale transactions.
- `GET /api/whales/by-token/:token` - Fetch whale transactions related to a specific token.
- `GET /api/whales/stats` - Get statistical insights on whale movements.

## 📊 Web Dashboard

WhaleTrack includes a **user-friendly web dashboard** for monitoring and configuration:

- **Real-time Transaction Feed**: Visual representation of whale movements.
- **Sentiment Trends**: Track market sentiment from various social media sources.
- **Token Explorer**: Detailed breakdown of specific cryptocurrencies.
- **Custom Alerts**: Configure personalized alerts based on predefined conditions.
- **Agent Management**: Monitor and control active data-processing agents.

Access the dashboard at `http://localhost:3000` after running the services.

## 🤝 Contributing

Contributions are welcome! Follow these steps to contribute:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'Add some amazing feature'`.
4. Push the branch: `git push origin feature/amazing-feature`.
5. Open a **Pull Request**.

For more details, check our [Contribution Guidelines](CONTRIBUTING.md).

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- **[OpenServ Labs](https://openserv.org)** for the AI agent framework.
- **[Etherscan API](https://etherscan.io/apis)** for blockchain data insights.
- **[OpenAI](https://openai.com/)** for powering sentiment analysis.
- **[Telegram Bot API](https://core.telegram.org/bots/api)** for integration.

---

### Built with ❤️ by the WhaleTrack Team
