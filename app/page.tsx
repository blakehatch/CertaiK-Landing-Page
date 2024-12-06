"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import AuditModal from "@/components/audit-modal";
import AdvancedOptionsModal from "@/components/advanced-options";

import { auditPromptText } from "@/components/prompt";

export default function AuditPage() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [auditMarkdown, setAuditMarkdown] = useState<string | null>(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);
  const [advancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [auditPrompt, setAuditPrompt] = useState<string>(auditPromptText);

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

  const removeComments = (report: string): string => {
    report = report.replace(/\/\/.*$/gm, '');
    report = report.replace(/\/\*[\s\S]*?\*\//g, '');
    return report;
  };

  const handleSubmitAudit = async () => {
    setIsButtonDisabled(true);

    const cleanedFileContent = removeComments(fileContent || '');

    console.log(cleanedFileContent);

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: cleanedFileContent, prompt: auditPrompt }),
      signal: AbortSignal.timeout(600000),
    });

    if (response.ok) {
      const responseData = await response.json();

      const auditReport = JSON.parse(responseData);

      console.log(auditReport);

      setAuditMarkdown(auditReport);
      console.log('Audit request sent successfully');
    } else {
      console.error('Failed to send audit request');
      setIsButtonDisabled(false);
    }
  };

  const handleCloseModal = () => {
    setAuditMarkdown(null);
    setShowAdvancedOptions(false);
    setIsButtonDisabled(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white overflow-hidden">
      <div className="fixed top-0 left-0 w-full bg-gradient-to-r from-cyan-500 to-cyan-700 text-white text-center py-1 z-50">
        <a href="https://x.com/blakewhatch/status/1864829229604499648?s=46" target="_blank" rel="noopener noreferrer" className="underline">
          🚨 Active Bug Bounty: Participate now for a chance to earn rewards! 🚨
        </a>
      </div>

      <div className="absolute top-0 left-0 mt-16 ml-4 cursor-pointer" onClick={() => window.open('https://www.certaik.xyz', '_blank', 'noopener,noreferrer')}>
        <img src="/logo.svg" alt="Logo" className="h-16 w-auto" />
      </div>

      <div className="relative z-10 mt-32 px-4">
        <h1 className="text-5xl font-bold text-center mt-4 mb-4 text-white">
           Smart Contract Auditor AI
        </h1>
        <div className="flex flex-col items-center">
          <label className="mb-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-2 px-4 rounded cursor-pointer inline-block">
            <span>Upload .sol or .rs file</span>
            <input
              type="file"
              accept=".sol,.rs"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <Textarea 
            placeholder="Paste Solidity or Rust code here..." 
            className="mb-8 text-white bg-gray-800 h-64" 
            onChange={(e) => setFileContent(e.target.value)}
          />
          <p className="text-sm text-gray-400 mb-2">
            *This feature is experimental. An AI agent, <a href="https://twitter.com/CertaiK_Agent" className="text-cyan-400 underline">CertaiK</a>, will audit your code. 
            Please review the results manually and provide feedback to improve performance.
          </p>
          <div className="flex items-center space-x-4 mt-4">
            <button 
              className={`bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 px-10 rounded text-lg ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleSubmitAudit}
              disabled={isButtonDisabled}
            >
              {isButtonDisabled ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>Processing...</span>
                </div>
              ) : 'Generate Audit'}
            </button>
            <button 
              className="bg-gradient-to-r from-gray-500 to-gray-700 text-white font-bold py-3 px-6 rounded text-lg"
              onClick={() => setShowAdvancedOptions(true)}
            >
              Advanced Options
            </button>
          </div>
          {auditMarkdown && (
            <AuditModal 
              auditMarkdown={auditMarkdown} 
              onClose={handleCloseModal}
            />
          )}
          {advancedOptions &&
            <AdvancedOptionsModal
              setPromptText={setAuditPrompt}
              promptText={auditPrompt}
              onClose={() => setShowAdvancedOptions(false)}
            />
          }
          {fileContent && (
            <pre className="bg-gray-800/50 p-4 mt-10 mb-20 rounded-lg text-white max-w-4xl w-full overflow-auto">
              {fileContent}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}