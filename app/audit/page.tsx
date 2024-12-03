"use client";

import { useState } from "react";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";

export default function AuditPage() {
  const [fileContent, setFileContent] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmitAudit = async () => {
    console.log(fileContent);
    const response = await fetch('/api/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: fileContent }),
    });

    if (response.ok) {
      console.log('Audit request sent successfully');
    } else {
      console.error('Failed to send audit request');
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <div className="relative w-full h-full">
          <Image
            src="/cyberpunk-city.jpg"
            alt="Cyberpunk City"
            layout="fill"
            objectFit="cover"
            quality={100}
            className="brightness-50 filter blur-md"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/30 via-purple-500/20 to-[#0a0a0a]/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 mt-10 px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-white-400">
          Upload Your Code for Audit*
        </h1>
        <div className="flex flex-col items-center">
          <label className="mb-4 bg-cyan-500 text-white font-bold py-2 px-4 rounded cursor-pointer inline-block">
            <span>Upload .sol or .rs file</span>
            <input
              type="file"
              accept=".sol,.rs"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <div className="flex flex-col items-center mb-4">
            <span className="text-cyan-400 text-lg">⬆</span>
            <p className="text-sm text-cyan-400">
              Upload or Paste code for auditing
            </p>
            <span className="text-cyan-400 text-lg">⬇</span>
          </div>
          <Textarea 
            placeholder="Paste Solidity or Rust code here..." 
            className="mb-8 text-white bg-black h-64" 
            onChange={(e) => setFileContent(e.target.value)}
          />
          <p className="text-sm text-gray-400 mb-2">
            *This feature is experimental. An AI agent, <a href="https://twitter.com/CertaiK_Agent" className="text-cyan-400 underline">CertaiK</a>, will audit your code. 
            Please review the results manually and provide feedback to improve performance.
          </p>
          <button 
            className="bg-cyan-500 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={handleSubmitAudit}
          >
            Generate Audit
          </button>
          {fileContent && (
            <pre className="bg-[#0a0a0a]/50 p-4 mt-10 mb-20 rounded-lg text-white placeholder-white max-w-4xl w-full overflow-auto">
              {fileContent}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}
