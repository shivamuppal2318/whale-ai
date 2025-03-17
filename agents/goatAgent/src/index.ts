import dotenv from 'dotenv';
import { startGoatApiServer } from './goatApi';

// Load environment variables
dotenv.config();

// Start the server
async function main() {
  try {
    await startGoatApiServer();
    console.log('GoatAgent API server started successfully');
  } catch (error) {
    console.error('Failed to start GoatAgent API server:', error);
    process.exit(1);
  }
}

main();