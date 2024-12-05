# Fetch Trending Coins

This project is an early-stage script that fetches trending cryptocurrency coins from CoinGecko, retrieves their contract source codes from supported block explorers (Etherscan, BscScan, PolygonScan), and saves the data locally for further analysis.

## Features

- **Fetch Trending Coins:** Retrieves the list of trending coins from the CoinGecko API.
- **Fetch Contract Source Code:** Obtains the contract source code for supported platforms:
  - **Ethereum** (via Etherscan)
  - **Binance Smart Chain** (via BscScan)
  - **Polygon** (via PolygonScan)
- **Save Data Locally:** Stores contract source code, coin details, and Twitter handles in organized JSON files.

## Prerequisites

- **Node.js** (version 12 or higher)
- **npm** (Node Package Manager)

## Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo/twitter   ```

2. **Install Dependencies:**
   ```bash
   npm install   ```

3. **Set Up Environment Variables:**

   Create a `.env` file in the `twitter` directory and add your API keys:
   ```env
   ETHERSCAN_API_KEY=your_etherscan_api_key
   BSCSCAN_API_KEY=your_bscscan_api_key
   POLYGONSCAN_API_KEY=your_polygonscan_api_key   ```

   - Replace `your_etherscan_api_key` with your Etherscan API key.
   - Replace `your_bscscan_api_key` with your BscScan API key.
   - Replace `your_polygonscan_api_key` with your PolygonScan API key.

   **Note:** You can obtain API keys by signing up on the respective explorers' websites.

4. **Configure TypeScript (If Necessary):**

   Ensure your `tsconfig.json` is set up correctly. An example configuration:
   ```json:title=tsconfig.json
   {
     "compilerOptions": {
       "target": "ES2019",
       "module": "commonjs",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "lib": ["esnext"],
       "typeRoots": ["./node_modules/@types"]
     },
     "include": ["**/*.ts"],
     "exclude": ["node_modules"]
   }   ```

## Usage

Run the script using the following npm command:
```bash
npm run fetchTrendingCoins
```

**What Happens:**

- The script fetches trending coins from CoinGecko.
- For each coin, it attempts to:
  - Retrieve the coin's Twitter handle.
  - Fetch the contract source code from the supported block explorers.
- Saves the retrieved data into JSON files under the `data` directory.

## Output

The data is saved in
twitter/
├── data/
│ ├── ethereum/
│ │ ├── <contractAddress>.json
│ ├── binance-smart-chain/
│ │ ├── <contractAddress>.json
│ └── polygon-pos/
│ ├── <contractAddress>.json


Each JSON file contains:

- `contractAddress`: The contract's address.
- `contractSourceCode`: The source code retrieved from the block explorer.
- `twitterHandle`: The coin's Twitter handle (if available).
- `coinDetails`: Additional details about the coin from CoinGecko.

**Example JSON Structure:**
```json
{
"contractAddress": "0xd5eaaac47bd1993d661bc087e15dfb079a7f3c19",
"contractSourceCode": "pragma solidity 0.8.18;\n\ninterface IERC20 {...}",
"twitterHandle": "komabnb",
"coinDetails": {
"id": "koma-inu",
"symbol": "koma",
"name": "Koma Inu",
"platforms": {
"binance-smart-chain": "0xd5eaaac47bd1993d661bc087e15dfb079a7f3c19"
},
"...": "..."
}
```

## Notes

- **Early Stages:** This project is in its early development stages. Features and functionalities are subject to change.
- **API Rate Limits:** The script includes a delay to respect API rate limits. Adjust the delay duration in `fetchTrendingCoins.ts` if necessary.
- **Data Privacy:** Ensure sensitive information (like API keys and data files) is not committed to version control. Refer to the `.gitignore` file setup below.