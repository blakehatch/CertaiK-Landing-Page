
import axios from 'axios';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sha256Address = url.searchParams.get('address');
    const platforms = ['etherscan.io', 'bscscan.com', 'polygonscan.com', 'basescan.org'];

    if (!sha256Address) {
      return new Response(JSON.stringify({ error: 'Address parameter is required' }), { status: 400 });
    }

    for (const platform of platforms) {
      const sourceCode = await fetchContractSourceCodeFromExplorer(platform, sha256Address);
      if (sourceCode) {
        return new Response(JSON.stringify({ platform, sourceCode }), { status: 200 });
      }
    }

    return new Response(JSON.stringify({ error: 'No source code found for the given address on any platform' }), { status: 404 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}

// Function to fetch contract source code from a generic blockchain explorer
async function fetchContractSourceCodeFromExplorer(platform: string, sha256Address: string): Promise<string | null> {
  try {
    const apiKey = getApiKeyForPlatform(platform);
    if (!apiKey) {
      console.log(`No API key found for platform: ${platform}`);
      return null;
    }

    const url = `https://api.${platform}/api`;
    const params = new URLSearchParams({
      module: 'contract',
      action: 'getsourcecode',
      address: sha256Address,
      apikey: apiKey,
    });

    const response = await axios.get(`${url}?${params.toString()}`);

    const result = response.data.result;
    if (result && result.length > 0 && result[0].SourceCode) {
      return result[0].SourceCode;
    } else {
      console.log(`No source code found for contract ${sha256Address} on ${platform}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching contract source code from ${platform} for address ${sha256Address}:`, error);
    return null;
  }
}

// API keys for different explorers
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;

// Helper function to get the API key for a given platform
function getApiKeyForPlatform(platform: string): string | undefined {
  switch (platform) {
    case 'etherscan.io':
    case 'api-sepolia.etherscan.io':
      return ETHERSCAN_API_KEY;
    case 'bscscan.com':
    case 'api-testnet.bscscan.com':
      return BSCSCAN_API_KEY;
    case 'polygonscan.com':
    case 'api-amoy.polygonscan.com':
      return POLYGONSCAN_API_KEY;
    case 'basescan.org':
    case 'api-sepolia.basescan.org':
      return BASESCAN_API_KEY;
    default:
      return undefined;
  }
}
