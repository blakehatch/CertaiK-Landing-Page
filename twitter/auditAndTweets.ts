import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import Replicate from 'replicate';

dotenv.config();

// Twitter API credentials from .env file
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY as string,
  appSecret: process.env.TWITTER_API_SECRET as string,
  accessToken: process.env.TWITTER_ACCESS_TOKEN as string,
  accessSecret: process.env.TWITTER_ACCESS_SECRET as string,
});

// Replicate API configuration
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const auditedContractsFile = path.join(__dirname, 'auditedContracts.json');

async function loadAuditedContracts(): Promise<Set<string>> {
  try {
    const data = await fs.readFile(auditedContractsFile, 'utf8');
    const contracts = JSON.parse(data) as string[];
    return new Set(contracts);
  } catch {
    // If file doesn't exist, return an empty set
    return new Set();
  }
}

async function saveAuditedContract(contractAddress: string) {
  const auditedContracts = await loadAuditedContracts();
  auditedContracts.add(contractAddress);
  await fs.writeFile(auditedContractsFile, JSON.stringify(Array.from(auditedContracts)), 'utf8');
}

export async function auditAndTweet() {
  // Load audited contracts
  const auditedContracts = await loadAuditedContracts();

  // Path to the data directory
  const dataDir = path.join(__dirname, 'data');

  // Get list of platforms
  const platforms = await fs.readdir(dataDir);

  for (const platform of platforms) {
    const platformDir = path.join(dataDir, platform);
    const contractFiles = await fs.readdir(platformDir);

    for (const file of contractFiles) {
      const contractAddress = path.basename(file, '.json');

      if (!auditedContracts.has(contractAddress)) {
        const filePath = path.join(platformDir, file);
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

        const { contractSourceCode, twitterHandle, coinDetails } = data;

        if (!twitterHandle) {
          console.log(`No Twitter handle for contract ${contractAddress}, skipping.`);
          continue;
        }

        console.log(`Auditing contract ${contractAddress} for ${coinDetails.name}`);

        // Perform Replicate model audit
        const auditReport = await callReplicateModel(contractSourceCode);

        if (!auditReport) {
          console.error(`Failed to get audit report for contract ${contractAddress}, skipping.`);
          continue;
        }

        // Summarize audit findings
        const summary = await summarizeAudit(auditReport);

        // Compose tweet message
        const tweetMessage = composeTweetMessage(twitterHandle, coinDetails.name, summary);

        // Post tweet
        console.log(tweetMessage);
        // await postTweet(tweetMessage);

        // Save contract as audited
        await saveAuditedContract(contractAddress);

        // Add a delay to respect API rate limits
        await delay(2000);
      } else {
        console.log(`Contract ${contractAddress} has already been audited.`);
      }
    }
  }
}

// Function to call Replicate model
async function callReplicateModel(contractSourceCode: string): Promise<string | undefined> {
  try {
    // Prepare the prompt
    const prompt = `Analyze the following Solidity contract and provide an audit report highlighting any potential security vulnerabilities. List the findings categorized as High, Medium, or Low severity.\n\nContract:\n${contractSourceCode}\n\nAudit Report:`;

    // Define the input for the model
    const input = {
      prompt: prompt,
      max_new_tokens: 512,
      prompt_template: "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
    };

    // Call the Replicate model
    const output = await replicate.run("meta/meta-llama-3-70b-instruct", { input });

    const outputString = Array.isArray(output) ? output.join("") : String(output);
    console.log(`Audit Report:\n${outputString}`);
    return outputString;
  } catch (error) {
    console.error("Error calling Replicate model:", error);
    return undefined;
  }
}

// Function to summarize audit findings
function summarizeAudit(auditReport: string): { high: number; medium: number; low: number } {
    // Simple parsing logic based on numbering under each severity heading
    const highSection = auditReport.split('**High Severity Findings:**')[1]?.split('**Medium Severity Findings:**')[0];
    const mediumSection = auditReport.split('**Medium Severity Findings:**')[1]?.split('**Low Severity Findings:**')[0];
    const lowSection = auditReport.split('**Low Severity Findings:**')[1];
  
    const highMatches = highSection ? (highSection.match(/^\d+\./gm) || []).length : 0;
    const mediumMatches = mediumSection ? (mediumSection.match(/^\d+\./gm) || []).length : 0;
    const lowMatches = lowSection ? (lowSection.match(/^\d+\./gm) || []).length : 0;
  
    return {
      high: highMatches,
      medium: mediumMatches,
      low: lowMatches,
    };
  }

// Function to compose tweet message
function composeTweetMessage(
  twitterHandle: string,
  coinName: string,
  summary: { high: number; medium: number; low: number }
): string {
  return `Hi @${twitterHandle}!

You are trending right now on CoinGecko! 📈

We audited your contract to help you:

🔴 High Severity Issues: ${summary.high}
🟠 Medium Severity Issues: ${summary.medium}
🟢 Low Severity Issues: ${summary.low}

For more details, visit: certaik.xyz and audit your contract.

#${coinName.replace(/\s+/g, '')} #Crypto #CertaiK #Audit`;
}

// Function to post tweet
async function postTweet(message: string) {
  try {
    await twitterClient.v2.tweet(message);
    console.log('Tweet posted successfully.');
  } catch (error) {
    console.error('Error posting tweet:', error);
  }
}

// Function to introduce a delay
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
