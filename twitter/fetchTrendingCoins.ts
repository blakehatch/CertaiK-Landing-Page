import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;

// Endpoints
const TRENDING_COINS_ENDPOINT = '/search/trending';
const COIN_DETAILS_ENDPOINT = (id: string) => `/coins/${id}`;

const processedCoinsFile = path.join(__dirname, 'processedCoins.json');

async function loadProcessedCoins(): Promise<Set<string>> {
    try {
      const data = await fs.readFile(processedCoinsFile, 'utf8');
      const coins = JSON.parse(data) as string[];
      return new Set(coins);
    } catch {
      // If file doesn't exist, return an empty set
      return new Set();
    }
  }

async function saveProcessedCoin(coinId: string) {
    const processedCoins = await loadProcessedCoins();
    processedCoins.add(coinId);
    await fs.writeFile(processedCoinsFile, JSON.stringify(Array.from(processedCoins)), 'utf8');
}  

// Function to introduce a delay
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchTrendingCoins() {
  try {
    const processedCoins = await loadProcessedCoins();

    // 1. Fetch Trending Coins
    const trendingResponse = await axios.get(`${COINGECKO_API_URL}${TRENDING_COINS_ENDPOINT}`);
    const trendingCoins = trendingResponse.data.coins;

    for (const coin of trendingCoins) {
      const { item } = coin;
      const coinId = item.id;

    // Skip if the coin has already been processed
    if (processedCoins.has(coinId)) {
        console.log(`Coin ${item.name} (ID: ${coinId}) has already been processed, skipping.`);
        continue;
        }

      console.log(`\nFetching details for coin: ${item.name} (ID: ${coinId})`);

      // 2. Fetch Coin Details using Coin ID
      const coinDetailsResponse = await axios.get(`${COINGECKO_API_URL}${COIN_DETAILS_ENDPOINT(coinId)}`, {
        params: {
          localization: false, // Optional: reduces response size
          tickers: false,
          market_data: false,
          community_data: false,
          developer_data: false,
          sparkline: false,
        },
      });
      const coinDetails = coinDetailsResponse.data;

      // Extract the Twitter handle
      const twitterHandle = coinDetails.links?.twitter_screen_name || '';
      console.log(`Twitter handle for ${item.name}: ${twitterHandle}`);

      // 3. Extract Contract Addresses
      if (coinDetails.platforms && Object.keys(coinDetails.platforms).length > 0) {
        const platforms = coinDetails.platforms as { [key: string]: string };
        console.log(`Platforms for ${item.name}:`, platforms);

        let hasValidContract = false;

        for (const [platform, contractAddress] of Object.entries(platforms)) {
          if (contractAddress) {
            console.log(`Contract address for ${item.name} on ${platform}: ${contractAddress}`);

            // 4. Fetch Contract Source Code based on Supported Platforms
            const lowerPlatform = platform.toLowerCase();

            if (['ethereum', 'binance-smart-chain', 'polygon-pos', 'matic-network'].includes(lowerPlatform)) {
              const contractSourceCode = await fetchContractSourceCode(lowerPlatform, contractAddress);
              if (contractSourceCode) {
                console.log(`Successfully retrieved contract source code for ${item.name} on ${platform}`);

                // Save the contract source code to a file (include Twitter handle)
                await saveContractSourceCode(
                  lowerPlatform,
                  contractAddress,
                  contractSourceCode,
                  coinDetails,
                  twitterHandle
                );

                hasValidContract = true;
                break; // If you only want to process one contract per coin
              } else {
                console.log(`Failed to retrieve contract source code for ${item.name} on ${platform}`);
              }
            } else {
              console.log(`Platform ${platform} is not supported for contract source code retrieval.`);
            }
          } else {
            console.log(`No contract address found for ${item.name} on ${platform}`);
          }
        }

        if (!hasValidContract) {
          console.log(`No valid contracts found for ${item.name} on supported platforms.`);
        }
      } else {
        console.log(`No platforms found for ${item.name}`);
      }

      await saveProcessedCoin(coinId);

      // Add a 2-second delay before processing the next coin
      await delay(2000);
    }
  } catch (error) {
    console.error('Error fetching trending coins:', (error as Error).message);
  }
}

async function fetchContractSourceCode(platform: string, contractAddress: string): Promise<string | null> {
  switch (platform) {
    case 'ethereum':
      return await fetchEtherscanContractSourceCode(contractAddress);
    case 'binance-smart-chain':
      return await fetchBscScanContractSourceCode(contractAddress);
    case 'polygon-pos':
    case 'matic-network':
      return await fetchPolygonScanContractSourceCode(contractAddress);
    default:
      console.log(`No API support implemented for platform: ${platform}`);
      return null;
  }
}

// Function to fetch contract source code from Etherscan
async function fetchEtherscanContractSourceCode(contractAddress: string): Promise<string | null> {
  try {
    const response = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: 'contract',
        action: 'getsourcecode',
        address: contractAddress,
        apiKey: ETHERSCAN_API_KEY,
      },
    });

    const result = response.data.result;
    if (result && result.length > 0 && result[0].SourceCode) {
      return result[0].SourceCode;
    } else {
      console.log(`No source code found for contract ${contractAddress} on Etherscan`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching contract source code from Etherscan for address ${contractAddress}:`, error);
    return null;
  }
}

// Function to fetch contract source code from BscScan
async function fetchBscScanContractSourceCode(contractAddress: string): Promise<string | null> {
  try {
    const response = await axios.get(`https://api.bscscan.com/api`, {
      params: {
        module: 'contract',
        action: 'getsourcecode',
        address: contractAddress,
        apiKey: BSCSCAN_API_KEY,
      },
    });

    const result = response.data.result;
    if (result && result.length > 0 && result[0].SourceCode) {
      return result[0].SourceCode;
    } else {
      console.log(`No source code found for contract ${contractAddress} on BscScan`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching contract source code from BscScan for address ${contractAddress}:`, error);
    return null;
  }
}

// Function to fetch contract source code from PolygonScan
async function fetchPolygonScanContractSourceCode(contractAddress: string): Promise<string | null> {
  try {
    const response = await axios.get(`https://api.polygonscan.com/api`, {
      params: {
        module: 'contract',
        action: 'getsourcecode',
        address: contractAddress,
        apiKey: POLYGONSCAN_API_KEY,
      },
    });

    const result = response.data.result;
    if (result && result.length > 0 && result[0].SourceCode) {
      return result[0].SourceCode;
    } else {
      console.log(`No source code found for contract ${contractAddress} on PolygonScan`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching contract source code from PolygonScan for address ${contractAddress}:`, error);
    return null;
  }
}

// Function to save the contract source code to a file (include Twitter handle)
async function saveContractSourceCode(
  platform: string,
  contractAddress: string,
  contractSourceCode: string,
  coinDetails: any,
  twitterHandle: string
) {
  try {
    // Create the directory path
    const dataDir = path.join(__dirname, 'data', platform);
    await fs.mkdir(dataDir, { recursive: true });

    // Prepare the data to be saved
    const data = {
      contractAddress,
      contractSourceCode,
      twitterHandle,
      coinDetails,
    };

    // Define the file path
    const fileName = `${contractAddress}.json`;
    const filePath = path.join(dataDir, fileName);

    // Write the data to the file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Contract source code saved to ${filePath}`);
  } catch (error) {
    console.error(`Error saving contract source code for address ${contractAddress}:`, error);
  }
}