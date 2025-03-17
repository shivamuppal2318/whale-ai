# WhaleTrackerAI Agents

A simple agent system for tracking whale transactions on Arbitrum Mainnet using OpenServ.

## Structure
- `whaleAgent/`: Contains the WhaleTrackerAI agent for monitoring USDC whale movements.

## Setup
1. Navigate to `whaleAgent/`.
2. Run `npm install`.
3. Add your `MORALIS_API_KEY` to `.env`.
4. Add your `NGROK_AUTH_TOKEN` to `.env` (sign up at ngrok.com if you don't have one).
5. Start with `npm start`.

## Usage
- The agent provides a REST API endpoint that can be accessed at `/api/whale-tracker`.
- When started, the agent will display a public ngrok URL you can use to access it.
- Send POST requests to `{ngrok-url}/api/whale-tracker` with JSON body:
  ```json
  {
    "whaleAddress": "0xb28f7c53131785e432e6e8b7f76456c27a874cf0",
    "threshold": 1000000
  }
  ```
- Health check is available at `{ngrok-url}/health`.