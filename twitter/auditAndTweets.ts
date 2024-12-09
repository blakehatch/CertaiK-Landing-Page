// Make sure you have installed the dependencies:
// npm install axios dotenv twitter-api-v2 pastebin-api replicate fs-extra
// Also ensure you have a .env file with the required keys such as:
// TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET, REPLICATE_API_TOKEN, TWITTER_HANDLE
// ETHERSCAN_API_KEY, BSCSCAN_API_KEY, POLYGONSCAN_API_KEY as needed.

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { TwitterApi, TweetV2 } from 'twitter-api-v2';
// @ts-ignore - pastebin-api might not have type declarations
import { PasteClient, Publicity, ExpireDate } from "pastebin-api";
import Replicate from 'replicate';

dotenv.config();

// Twitter API credentials
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY as string,
  appSecret: process.env.TWITTER_API_SECRET as string,
  accessToken: process.env.TWITTER_ACCESS_TOKEN as string,
  accessSecret: process.env.TWITTER_ACCESS_SECRET as string,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Pastebin client
if (!process.env.PASTEBIN_API_KEY) {
  throw new Error("No PASTEBIN_API_KEY found in environment variables.");
}

const client = new PasteClient(process.env.PASTEBIN_API_KEY);


// API keys for different explorers
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;

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

// Fetch contract source code from a supported explorer
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

// Helper function to get the API key for a given platform
function getApiKeyForPlatform(platform: string): string | undefined {
  switch (platform) {
    case 'etherscan.io':
      return ETHERSCAN_API_KEY;
    case 'bscscan.com':
      return BSCSCAN_API_KEY;
    case 'polygonscan.com':
      return POLYGONSCAN_API_KEY;
    case 'basescan.org':
      return BASESCAN_API_KEY;
    default:
      return undefined;
  }
}

// Function to scan multiple chains for the given sha256 address and return the source code if found
async function scanChainsForSha256Address(sha256Address: string): Promise<{platform: string; sourceCode: string} | null> {
  const platforms = ['etherscan.io', 'basescan.org', 'bscscan.com', 'polygonscan.com']; 
  for (const platform of platforms) {
    const sourceCode = await fetchContractSourceCodeFromExplorer(platform, sha256Address);
    if (sourceCode) {
      console.log(`Found contract source code on ${platform} for address ${sha256Address}`);
      return { platform, sourceCode };
    }
  }
  return null;
}

// Call Replicate model for audit
async function callReplicateModel(contractSourceCode: string): Promise<string | undefined> {
  try {
    const MAX_INPUT_LENGTH = 25000; // Adjust based on the model's limitations

    let trimmedSourceCode = contractSourceCode;

    // console.log(contractSourceCode);

    if (contractSourceCode.length > MAX_INPUT_LENGTH) {
      console.warn(`Contract source code exceeds maximum length (${MAX_INPUT_LENGTH} characters). Trimming the input.`);
      trimmedSourceCode = contractSourceCode.slice(0, MAX_INPUT_LENGTH) + '\n// [Content truncated due to length]';
    }

    // Assuming 'prompt' might be undefined and we have the contract code in 'trimmedSourceCode'

    const text = trimmedSourceCode;

    // If a prompt string is provided, use it. Otherwise, read from the audit-prompt.md file.
    const auditPromptResponse = await fs.readFile(path.join(process.cwd(), 'prompts', 'audit-prompt.md'), 'utf8');

    // Insert the contract code into the placeholder backticks in the prompt template
    const auditPrompt = auditPromptResponse.replace('```\n\n```', `\`\`\`\n${text}\n\`\`\``);


    // Now use `auditPrompt` as the prompt input for the model:
    const input = {
      prompt: auditPrompt,
      max_new_tokens: 1024,
      prompt_template: "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
};


    const output = await replicate.run("meta/meta-llama-3-70b-instruct", { input });
    const outputString = Array.isArray(output) ? output.join("") : String(output);
    return outputString;
  } catch (error) {
    console.error("Error calling Replicate model:", error);
    return undefined;
  }
}

// Summarize audit findings
function summarizeAudit(auditReport: string): { critical: number; high: number; medium: number; low: number } | null {
  const headingPatterns = [
    { name: 'critical', regex: /^\s*#{1,6}\s*(🚨\s*)?Critical\s*$/im },
    { name: 'high', regex: /^\s*#{1,6}\s*(🔴\s*)?High\s*$/im },
    { name: 'medium', regex: /^\s*#{1,6}\s*(🟠\s*)?Medium\s*$/im },
    { name: 'low', regex: /^\s*#{1,6}\s*(🟢\s*)?Low\s*$/im },
    { name: 'informational', regex: /^\s*#{1,6}\s*(🔵\s*)?Informational\s*$/im },
  ];

  interface HeadingPosition {
    name: string;
    index: number;
  }

  const headingPositions: HeadingPosition[] = headingPatterns
    .map(pattern => {
      const match = auditReport.match(pattern.regex);
      return match && match.index !== undefined ? { name: pattern.name, index: match.index } : null;
    })
    .filter((pos): pos is HeadingPosition => pos !== null);

  headingPositions.sort((a, b) => a.index - b.index);

  const sections: { [key: string]: string } = {};
  for (let i = 0; i < headingPositions.length; i++) {
    const currentHeading = headingPositions[i];
    const nextHeadingIndex = i + 1 < headingPositions.length ? headingPositions[i + 1].index : auditReport.length;
    const headingMatch = auditReport.slice(currentHeading.index).match(headingPatterns.find(p => p.name === currentHeading.name)!.regex);
    if (!headingMatch) continue;
    const sectionContent = auditReport.slice(
      currentHeading.index + headingMatch[0].length,
      nextHeadingIndex
    );
    sections[currentHeading.name] = sectionContent.trim();
  }

  const countFindings = (section: string): number => {
    const numberedItemsRegex = /^\s*\d+\.\s+/gm; 
    return (section.match(numberedItemsRegex) || []).length;
  };

  const critical = sections['critical'] ? countFindings(sections['critical']) : 0;
  const high = sections['high'] ? countFindings(sections['high']) : 0;
  const medium = sections['medium'] ? countFindings(sections['medium']) : 0;
  const low = sections['low'] ? countFindings(sections['low']) : 0;

  if (critical === 0 && high === 0 && medium === 0 && low === 0) {
    console.error('No findings detected in the audit report.');
    return null;
  }

  return { critical, high, medium, low };
}

// Compose tweet message with summary
function composeTweetMessage(
  twitterHandle: string,
  coinName: string,
  summary: { critical: number; high: number; medium: number; low: number },
  pastebinLink: string
): string {
  return `Hi @${twitterHandle}!
  
You are trending right now on CoinGecko!📈

We audited your contract to help you:

🔴 Critical Severity Issues: ${summary.critical}
🟠 High Severity Issues: ${summary.high}
🟡 Medium Severity Issues: ${summary.medium}
🟢 Low Severity Issues: ${summary.low}

Full Report: ${pastebinLink}

For more details, visit https://certaik.xyz and audit your contract.

#${coinName.replace(/\s+/g, '')} #Crypto #CertaiK #Audit`;
}

// Compose reply tweet message
function composeAuditReplyTweetMessage(
  twitterHandle: string,
  pastebinLink: string
): string {
  return `Hi @${twitterHandle}!

Here is the audit you requested:

${pastebinLink}`;
}

// Post a tweet
async function postTweet(message: string) {
  try {
    await twitterClient.v2.tweet(message);
    console.log('Tweet posted successfully.');
  } catch (error) {
    console.error('Error posting tweet:', error);
  }
}

// Post a reply tweet
async function postAuditReply(message: string, tweetId: string) {
  try {
    // reply expects (text: string, replyToId: string)
    await twitterClient.v2.reply(message, tweetId);
    console.log('Tweet reply posted successfully.');
  } catch (error) {
    console.error('Error posting tweet reply:', error);
  }
}

// Upload audit report to Pastebin
async function uploadToPastebin(auditReport: string, title: string): Promise<string> {
  try {
    const pasteUrl = await client.createPaste({
      code: auditReport,
      expireDate: ExpireDate.Never,
      publicity: Publicity.Public,
      name: title,
    });
    const rawUrl = pasteUrl.replace('https://pastebin.com/', 'https://pastebin.com/raw/');

    return rawUrl;
  } catch (error) {
    console.error("Error uploading to Pastebin:", error);
    throw error;
  }
}

// Delay
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Audit and tweet from local data directory (example)
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

        if (!twitterHandle || !coinDetails || !coinDetails.name || !contractSourceCode) {
          console.log(`Missing information for contract ${contractAddress}, skipping.`);
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
        const summary = summarizeAudit(auditReport);
        if (!summary) {
          console.log("No findings or failed to summarize. Skipping.");
          continue;
        }

        // Upload full report to Pastebin
        const pastebinLink = await uploadToPastebin(auditReport, `Audit Report ${contractAddress}`);

        // Compose tweet message
        const tweetMessage = composeTweetMessage(twitterHandle, coinDetails.name, summary, pastebinLink);

        // Post tweet
        console.log(tweetMessage);
        await postTweet(tweetMessage);

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

export async function auditAndReplyToMentions() {
  // Load audited contracts
  const auditedContracts = await loadAuditedContracts();

  // Get the current time and calculate the time one hour ago
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Fetch recent mentions from the last hour
  const query = `@${process.env.TWITTER_HANDLE}`;

  const mentions = await twitterClient.v2.search(query, {
    start_time: oneHourAgo.toISOString(),
    'tweet.fields': 'created_at,author_id',
    'user.fields': 'username'  });


  // Use the paginator's tweets property to get the TweetV2[]
  const tweets: TweetV2[] = mentions.tweets;

  for (const tweet of tweets) {
    const tweetText = tweet.text;
    const tweetId = tweet.id;
    const authorId = tweet.author_id;

    if (!authorId) {
      console.log("No author_id in tweet, skipping.");
      continue;
    }

    // Fetch the user's handle
    const user = await twitterClient.v2.user(authorId, { 'user.fields': 'username' });
    const twitterHandle = user.data?.username;
    if (!twitterHandle) {
      console.log("Couldn't retrieve twitter handle from author_id, skipping.");
      continue;
    }

    console.log(tweetText);
    // Check if the tweet contains a SHA-256 address and the word "audit"
    const sha256Regex = /\b0x[a-fA-F0-9]{40}\b/;
    if (sha256Regex.test(tweetText) && tweetText.toLowerCase().includes('audit')) {
      const contractAddress = tweetText.match(sha256Regex)![0];

      if (!auditedContracts.has(`${contractAddress}-${twitterHandle}`)) {
        console.log(`Auditing contract ${contractAddress} mentioned by @${twitterHandle}`);

        // Try to fetch contract source code from supported platforms
        const found = await scanChainsForSha256Address(contractAddress);
        if (!found) {
          // No supported chain found, reply accordingly
          const unsupportedMessage = `Hi @${twitterHandle}!\n\nWe don't support the chain for this contract yet. Please audit it manually at https://certaik.xyz`;
          console.log(unsupportedMessage);
          await postAuditReply(unsupportedMessage, tweetId);
          await delay(2000);
          continue;
        }

        // Perform Replicate model audit
        const auditReport = await callReplicateModel(found.sourceCode);

        if (!auditReport) {
          console.error(`Failed to get audit report for contract ${contractAddress}, skipping.`);
          continue;
        }

        // Upload full report to Pastebin
        const pastebinLink = await uploadToPastebin(auditReport, `Audit Report ${contractAddress}`);

        // Compose reply tweet message
        const replyMessage = composeAuditReplyTweetMessage(twitterHandle, pastebinLink);

        // Post reply tweet
        console.log(replyMessage);
        await postAuditReply(replyMessage, tweetId);

        // Save contract as audited with twitter handle
        await saveAuditedContract(`${contractAddress}-${twitterHandle}`);

        // Add a delay to respect API rate limits
        await delay(2000);
      } else {
        console.log(`Contract ${contractAddress} has already been audited.`);
      }
    }
  }
}

if (require.main === module) {
  (async () => {
    // await auditAndTweet();
    // await auditAndReplyToMentions();
  })().catch(console.error);
}
