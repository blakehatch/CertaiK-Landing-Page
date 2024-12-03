// Import the necessary modules
import { Readable } from 'stream';

// Function to convert ReadableStream to string
async function streamToString(stream: Readable): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function POST(req: any, res: any) {
  if (req.method === 'POST') {
    // Convert the ReadableStream to a string
    const textJson = await streamToString(req.body);
    const parsedObject = JSON.parse(textJson);
    const text = parsedObject.text;
    // console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN);
    // console.log('TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID);
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Fetch the audit prompt template
    const fs = require('fs').promises;
    const path = require('path');
    const auditPromptResponse = await fs.readFile(path.join(process.cwd(), 'prompts', 'audit-prompt.md'), 'utf8');
    //console.log(text);


    // const auditPromptTemplate = await auditPromptResponse.text();

    // console.log(auditPromptTemplate);

    // Insert the code text into the audit prompt
    let auditPrompt = auditPromptResponse.replace('```\n\n```', `\`\`\`\n${text}\n\`\`\``);

    const TELEGRAM_MESSAGE_LIMIT = 4096;
    const messages = [];

    while (auditPrompt.length > 0) {
      let chunk = auditPrompt.substring(0, TELEGRAM_MESSAGE_LIMIT);
      if (auditPrompt.length > TELEGRAM_MESSAGE_LIMIT) {
        const lastNewlineIndex = chunk.lastIndexOf('\n');
        if (lastNewlineIndex > -1) {
          chunk = auditPrompt.substring(0, lastNewlineIndex);
        }
      }
      messages.push(chunk);
      auditPrompt = auditPrompt.substring(chunk.length);
    }

    for (const message of messages) {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
          }),
        }
      );

      const data = await response.json();
      
      if (!data.ok) {
        console.error('Error sending message to Telegram:', data.description);
        return new Response(JSON.stringify({ success: false, error: data.description }), { status: 500 });
      }
    }
    
  } else {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
}