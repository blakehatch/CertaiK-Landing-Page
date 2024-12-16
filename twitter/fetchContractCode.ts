import axios from 'axios';

// Function to fetch contract source code from a generic blockchain explorer
async function fetchContractSourceCodeFromExplorer(platform: string, sha256Address: string): Promise<string | null> {
  try {
    const apiKey = getApiKeyForPlatform(platform);
    if (!apiKey) {
      console.log(`No API key found for platform: ${platform}`);
      return null;
    }

    const url = `https://api.${platform}.com/api`;
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

// Helper function to get the API key for a given platform
function getApiKeyForPlatform(platform: string): string | undefined {
  switch (platform) {
    case 'etherscan':
      return ETHERSCAN_API_KEY;
    case 'bscscan':
      return BSCSCAN_API_KEY;
    case 'polygonscan':
      return POLYGONSCAN_API_KEY;
    // Add more platforms as needed
    default:
      return undefined;
  }
}

// Function to scan multiple chains for SHA-256 addresses
async function scanChainsForSha256Addresses(sha256Addresses: string[]): Promise<string[]> {
  const platforms = ['etherscan', 'bscscan', 'polygonscan']; // Add more platforms as needed
  const foundContracts: string[] = [];

  for (const address of sha256Addresses) {
    for (const platform of platforms) {
      const sourceCode = await fetchContractSourceCodeFromExplorer(platform, address);
      if (sourceCode) {
        foundContracts.push(sourceCode);
        console.log(`Found contract source code on ${platform} for address ${address}`);
        break; // Stop searching other platforms if found
      }
    }
  }

  return foundContracts;
}

// Example usage
async function main() {
  const sha256Addresses = ['address1', 'address2']; // Replace with actual SHA-256 addresses
  const contracts = await scanChainsForSha256Addresses(sha256Addresses);
  console.log('Found contracts:', contracts);
}

main().catch(console.error);