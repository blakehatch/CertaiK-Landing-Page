"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import AuditModal from "@/components/audit-modal";
import AdvancedOptionsModal from "@/components/advanced-options";

import { auditPromptText } from "@/components/gas-prompt";
import GasPriceBar from "@/components/gas-price";

export default function GasOptimizerPage() {
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

    const response = await fetch('/api/ai/gas', {
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
    <main 
      className="min-h-screen bg-black text-white overflow-hidden" 
      style={{ backgroundImage: 'url(/bg-pattern.webp)', backgroundSize: 'cover' }}
    >

      <div className="relative z-10 mt-32 px-4">
        <h1 className="text-5xl text-center mt-4 mb-10 text-white">
           Smart Contract Gas Optimizer AI
        </h1>
        <div className="flex flex-col items-center">
          <label className="mb-10 bg-gradient-to-r from-cyan-500 z-10 to-purple-500 text-white py-1 px-3 rounded cursor-pointer inline-block">
            <span>Upload .sol or .rs file</span>
            <input
              type="file"
              accept=".sol,.rs"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <div className="fixed inset-0 flex justify-center items-center z-0 pointer-events-none opacity-90" style={{ top: '-500px' }}>
            <div className="p-1 max-w-[900px] w-full z-0 h-64 rounded-full" 
                 style={{ 
                   background: 'radial-gradient(circle, rgba(255,0,0,0.4) 0%, rgba(0,0,255,0.4) 120%)', 
                   filter: 'blur(60px) opacity(0.99)'  // Increased blur and adjusted opacity
                 }}>
            </div>
          </div>
          <Textarea 
              placeholder="Paste Solidity or Rust code here..." 
              className="text-white bg-black z-10 h-48 max-w-[800px] w-full rounded mb-6"
              onChange={(e) => setFileContent(e.target.value)}
            />
          <p className="text-xs text-gray-400 z-10 mb-2 max-w-[600px]">
            *Experimental feature: AI agent <a href="https://twitter.com/CertaiK_Agent" className="text-cyan-400 underline">CertaiK</a> audits your code. 
            Manually review results and provide feedback.
          </p>
          <div className="flex items-center z-10 space-x-3 mt-4">
            <button 
              className={`bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2 px-8 rounded text-md ${(isButtonDisabled || !fileContent) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleSubmitAudit}
              disabled={isButtonDisabled || !fileContent}
            >
              {isButtonDisabled ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>Processing...</span>
                </div>
              ) : 'Generate Audit'}
            </button>
            <button 
              className="bg-gradient-to-r from-gray-500 to-gray-700 text-white py-2 px-5 rounded text-md"
              onClick={() => setShowAdvancedOptions(true)}
            >
              Advanced Options
            </button>
          </div>
          <GasPriceBar/>
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
            <pre className="bg-gray-800/50 p-4 mt-8 mb-16 rounded-lg text-white max-w-4xl w-full overflow-auto">
              {fileContent}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}