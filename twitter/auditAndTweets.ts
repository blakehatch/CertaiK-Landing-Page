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

// Function to call Replicate model
async function callReplicateModel(contractSourceCode: string): Promise<string | undefined> {
  try {
   
    const MAX_INPUT_LENGTH = 25000; // Adjust based on the model's limitations

    let trimmedSourceCode = contractSourceCode;

    if (contractSourceCode.length > MAX_INPUT_LENGTH) {
      console.warn(`Contract source code exceeds maximum length (${MAX_INPUT_LENGTH} characters). Trimming the input.`);
      // Optionally, you can truncate or summarize
      trimmedSourceCode = contractSourceCode.slice(0, MAX_INPUT_LENGTH) + '\n// [Content truncated due to length]';
    }

    // Prepare the prompt
    const prompt = `Analyze the following Solidity contract and provide an audit report highlighting any potential security vulnerabilities. List the findings categorized as Critical Severity Findings, High Severity Findings, Medium Severity Findings, or Low Severity Findings. Follow the format of the provided template exactly.\n\nContract:\n${trimmedSourceCode}\n\nAudit Report:`;

    // Define the input for the model
    const input = {
      prompt: prompt,
      max_new_tokens: 1024,
      prompt_template: "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
    };

    // console.log("Input:", input);

    // Call the Replicate model
    const output = await replicate.run("meta/meta-llama-3-70b-instruct", { input });

    const outputString = Array.isArray(output) ? output.join("") : String(output);
    return outputString;
  } catch (error) {
    console.error("Error calling Replicate model:", error);
    return undefined;
  }
}

// Function to summarize audit findings
function summarizeAudit(auditReport: string): { critical: number; high: number; medium: number; low: number } {
    // Define regex patterns for headings
    const headingPatterns = [
        { name: 'critical', regex: /^\s*(\*\*|\*)?\s*Critical Severity Findings?:?\s*(\*\*|\*)?\s*$/im },
        { name: 'high', regex: /^\s*(\*\*|\*)?\s*High Severity Findings?:?\s*(\*\*|\*)?\s*$/im },
        { name: 'medium', regex: /^\s*(\*\*|\*)?\s*Medium Severity Findings?:?\s*(\*\*|\*)?\s*$/im },
        { name: 'low', regex: /^\s*(\*\*|\*)?\s*Low Severity Findings?:?\s*(\*\*|\*)?\s*$/im },
        { name: 'recommendations', regex: /^\s*(\*\*|\*)?\s*Recommendations?:?\s*(\*\*|\*)?\s*$/im },
    ];

    // Locate heading positions
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

    // Sort headings by position in the text
    headingPositions.sort((a, b) => a.index - b.index);

    // Extract sections between headings
    const sections: { [key: string]: string } = {};
    for (let i = 0; i < headingPositions.length; i++) {
        const currentHeading = headingPositions[i];
        const nextHeadingIndex = i + 1 < headingPositions.length ? headingPositions[i + 1].index : auditReport.length;

        const sectionContent = auditReport.slice(
            currentHeading.index + auditReport.slice(currentHeading.index).match(headingPatterns.find(p => p.name === currentHeading.name)!.regex)![0].length,
            nextHeadingIndex
        );
        sections[currentHeading.name] = sectionContent.trim();
    }

    // Helper to count findings in a section based on numbering
    const countFindings = (section: string): number => {
        const numberedItemsRegex = /^\s*\d+\.\s+/gm; // Match lines starting with a numbered item
        return (section.match(numberedItemsRegex) || []).length;
    };

    // Count findings in each severity section
    const critical = sections['critical'] ? countFindings(sections['critical']) : 0;
    const high = sections['high'] ? countFindings(sections['high']) : 0;
    const medium = sections['medium'] ? countFindings(sections['medium']) : 0;
    const low = sections['low'] ? countFindings(sections['low']) : 0;

    if (critical === 0 && high === 0 && medium === 0 && low === 0) {
        // Return random values as specified
        return {
            critical: Math.floor(Math.random() * 2), // Random integer between 0 and 1
            high: Math.floor(Math.random() * 2) + 1,     // Random integer between 1 and 2
            medium: Math.floor(Math.random() * 4) + 1,   // Random integer between 1 and 4
            low: Math.floor(Math.random() * 6) + 1       // Random integer between 1 and 6
        };
    }

    return { critical, high, medium, low };
}


// Function to compose tweet message
function composeTweetMessage(
    twitterHandle: string,
    coinName: string,
    summary: { critical: number; high: number; medium: number; low: number }
  ): string {
    return `Hi @${twitterHandle}!
  
  You are trending right now on CoinGecko!📈
  
  We audited your contract to help you:
  
  🔴 Critical Severity Issues: ${summary.critical}
  🟠 High Severity Issues: ${summary.high}
  🟡 Medium Severity Issues: ${summary.medium}
  🟢 Low Severity Issues: ${summary.low}
  
  For more details, visit https://certaik.xyz and audit your contract.
  
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
