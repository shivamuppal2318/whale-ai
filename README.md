# WhaleTrack: Crypto Market Intelligence Platform

![WhaleTrack Logo](assets/logo.png)

WhaleTrack is a comprehensive cryptocurrency market intelligence platform that tracks large wallet transactions ("whale movements") and analyzes market sentiment from social media sources. By combining on-chain data with social signals, WhaleTrack provides traders and investors with actionable insights into market dynamics.

## 🌟 Features

- **Whale Transaction Monitoring**: Track large cryptocurrency movements across multiple blockchains
- **Telegram Sentiment Analysis**: Monitor crypto discussions and analyze market sentiment in real-time
- **Multi-chain Support**: Track transactions across Ethereum, Arbitrum, Solana, and other major networks
- **Alert System**: Receive notifications for significant market events
- **Interactive Dashboard**: Visualize whale movements and sentiment trends
- **API Integration**: Easily integrate WhaleTrack data into your trading systems
- **Historical Analysis**: Study patterns in whale behavior and market correlation

## 🏗️ Architecture

WhaleTrack uses a modular agent-based architecture powered by OpenServ SDK where each component specializes in a specific data source:

```
WhaleTrack/
├── Core Service - Orchestrates data flow and provides the main API
├── Web Dashboard - User interface for visualization and configuration
└── Agents/
    ├── whaleAgent - Tracks large wallet transactions on various blockchains
    ├── telegramAgent - Monitors Telegram channels for sentiment analysis
    ├── twitterAgent - Analyzes crypto discussions on Twitter
    └── newsAgent - Gathers relevant news from crypto publications
```

## 🛠️ Technology Stack

### OpenServ SDK

WhaleTrack is built on top of the **OpenServ SDK**, an advanced framework for creating autonomous AI agents with specialized capabilities. The OpenServ SDK enables:

- **Creation of intelligent agents** that can process and analyze specific data sources
- **Capability-based architecture** where each agent exposes well-defined capabilities
- **Seamless integration** between different components through standardized APIs
- **AI-powered processing** leveraging large language models for advanced analytics
- **Distributed deployment** of agents across different environments

All agents in the WhaleTrack ecosystem leverage the OpenServ SDK to provide consistent interfaces while maintaining modular independence.

## 📋 Requirements

- Node.js 16+
- MongoDB 4.4+
- Redis (for caching and pub/sub)
- OpenServ SDK (`@openserv-labs/sdk`)
- API keys for various services (blockchain explorers, Telegram, OpenAI, etc.)

## 🚀 Getting Started

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/WhaleTrack.git
   cd WhaleTrack
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the services
   ```bash
   # Start core service
   npm run start:core
   
   # Start agents in separate terminals
   npm run start:whale-agent
   npm run start:telegram-agent
   npm run start:twitter-agent
   
   # Start web dashboard
   npm run start:dashboard
   ```

## 🔧 Configuration

### Core Configuration

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/whaletrack
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

### Agent Configuration

Each agent has its own configuration. For example:

#### Telegram Agent
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
AGENT_PORT=8032
NGROK_AUTH_TOKEN=auth_token
TELEGRAM_CHANNELS=arbiscan_alerts,arbitrum,layer2news
```

#### Whale Agent
```
ETHERSCAN_API_KEY=your_etherscan_api_key
ARBITRUM_API_KEY=your_arbitrum_api_key
MINIMUM_TX_VALUE=100000
AGENT_PORT=8031
```

## 📊 API Reference

WhaleTrack exposes a comprehensive API for accessing all functionality:

### Core API Endpoints

- `GET /api/whales/transactions`: Get recent whale transactions
- `GET /api/whales/wallets/:address`: Get details about a specific whale wallet
- `GET /api/sentiment/overview`: Get overall market sentiment
- `GET /api/alerts`: Get recent alerts

### Telegram Agent Endpoints

- `GET /api/telegram/sentiment`: Get sentiment data for all monitored tokens
- `GET /api/telegram/sentiment/:token`: Get sentiment data for a specific token
- `GET /api/telegram/messages`: Get recent messages from monitored channels
- `POST /api/telegram/analyze`: Manually trigger sentiment analysis

### Whale Agent Endpoints

- `GET /api/whales/recent`: Get recent whale transactions
- `GET /api/whales/by-token/:token`: Get whale transactions for a specific token
- `GET /api/whales/stats`: Get statistical analysis of whale movements

## 📱 Dashboard

WhaleTrack includes a web-based dashboard for monitoring and configuration:

- **Transaction Monitor**: Real-time feed of whale transactions
- **Sentiment Analysis**: Visualization of market sentiment across platforms
- **Token Explorer**: Detailed analysis of specific tokens
- **Alert Configuration**: Set up custom alerts based on your criteria
- **Agent Management**: Configure and monitor the status of data agents

Access the dashboard at `http://localhost:3000` after starting the services.

## 🤝 Contributing

Contributions are welcome! Please check out our [contribution guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## 🙏 Acknowledgements

- [OpenServ Labs](https://openserv.org) for the agent SDK framework
- [Etherscan API](https://etherscan.io/apis) for blockchain data
- [OpenAI](https://openai.com/) for sentiment analysis capabilities
- [Telegram Bot API](https://core.telegram.org/bots/api) for Telegram integration

---

Built with ❤️ by the WhaleTrack Team
#   w h a l e - a i 
 
 