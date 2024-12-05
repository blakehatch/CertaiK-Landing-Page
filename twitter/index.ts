import axios from 'axios';
import { postTweet } from './utils';
import callReplicateModel from '';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export async function auditAndTweet() {
    try {
      // Fetch trending tokens from CoinGecko
      const response = await axios.get(`${COINGECKO_API_URL}/search/trending`);
      const trendingCoins = response.data.coins;
  
      for (const coin of trendingCoins) {
        const { item } = coin;
        const coinId = item.id;
        console.log(`Processing coin: ${item.name}`);
  
        // Fetch the Twitter handle and Solidity contract address
        const twitterHandle = await fetchTwitterHandle(coinId);
        const solidityContractAddress = await fetchSolidityContractAddress(coinId);
  
        if (!twitterHandle || !solidityContractAddress) {
          console.log(`Skipping coin ${item.name} due to missing information.`);
          continue;
        }
  
        // Fetch the audit prompt template
        const auditPromptResponse = await fs.readFile(
          path.join(process.cwd(), 'prompts', 'audit-prompt.md'),
          'utf8'
        );
  
        // Insert the code text into the audit prompt
        const auditPrompt = auditPromptResponse.replace(
          '```\n\n```',
          `\`\`\`\n${solidityContractAddress}\n\`\`\``
        );
  
        // Call the replicate model function with the generated audit prompt
        const replicateResponse = await callReplicateModel(auditPrompt);
  
        if (replicateResponse) {
          console.log(`Audit result for ${item.name}:`, replicateResponse);
  
          // Post the audit result on Twitter
          const tweetText = `Audit results for ${item.name} (@${twitterHandle}): ${replicateResponse}`;
          await postTweet(tweetText);
        } else {
          console.error(`Model call failed for ${item.name}`);
        }
      }
    } catch (error) {
      console.error('Error during audit and tweet process:', error);
    }
  }

// Placeholder functions. Implement these based on your data sources.
async function fetchTwitterHandle(coinId: string): Promise<string | null> {
  // Implement logic to fetch Twitter handle
  return 'example_handle';
}

async function fetchSolidityContractAddress(coinId: string): Promise<string | null> {
  // Implement logic to fetch Solidity contract address
  return '0xExampleContractAddress';
}