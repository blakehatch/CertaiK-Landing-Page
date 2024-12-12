import { NextApiRequest } from 'next';

export async function GET(req: NextApiRequest) {
  try {
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    const response = await fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${etherscanApiKey}`);
    if (!response.ok) {
      throw new Error('Failed to fetch gas price');
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}