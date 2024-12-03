// Import the necessary modules
import { Readable } from 'stream';
import Replicate from "replicate";
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const replicate = new Replicate();

export const maxDuration = 60; // This function can run for a maximum of 60 seconds
export const dynamic = 'force-dynamic';

// Function to convert ReadableStream to string
async function streamToString(stream: Readable): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// Function to call Replicate API
async function callReplicateModel(prompt: string): Promise<string | undefined> {
    try {
        // Define the input for the model
        const input = {
            prompt: prompt,
            max_new_tokens: 512,
            prompt_template: "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
        };

        // Call the Replicate model
        const output = await replicate.run("meta/meta-llama-3-70b-instruct", { input });

        const outputString = Array.isArray(output) ? output.join("") : String(output);
        console.log(outputString);
        return outputString;
    } catch (error) {
        console.error("Error calling Replicate model:", error);
    }
}

export async function POST(req: Request ) {
  if (req.method === 'POST' && req.body !== null) {
    // Convert the ReadableStream to a string
    const textJson = await streamToString(req.body as unknown as Readable);
    const parsedObject = JSON.parse(textJson);
    const text = parsedObject.text;

    // Fetch the audit prompt template
    const auditPromptResponse = await fs.readFile(path.join(process.cwd(), 'prompts', 'audit-prompt.md'), 'utf8');

    // Insert the code text into the audit prompt
    const auditPrompt = auditPromptResponse.replace('```\n\n```', `\`\`\`\n${text}\n\`\`\``);

    try {
        // Call the replicate model function with the generated audit prompt
        const replicateResponse = await callReplicateModel(auditPrompt);

        // If the call is successful, return the result
        console.log(replicateResponse);
        if (replicateResponse) {
            return NextResponse.json(JSON.stringify(replicateResponse), {
                headers: {
                    'Access-Control-Allow-Origin': 'app.certaik.xyz', // Replace with your client domain
                },
            });
        } else {
            console.error("Model call failed with response:", replicateResponse);
            return NextResponse.json({ error: "Failed to get a valid response from the model" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error during model call:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
}