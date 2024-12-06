import React from 'react';
import ReactMarkdown from 'react-markdown';

interface AuditModalProps {
  auditMarkdown: string;
  onClose: () => void;
}

const AuditModal: React.FC<AuditModalProps> = ({ auditMarkdown, onClose }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(auditMarkdown).then(() => {
      alert('Markdown copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy markdown: ', err);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([auditMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex justify-center items-center">
      <div className="bg-[#0a0a0a] p-6 rounded-lg max-w-4xl w-full h-[90vh]">
        <div className="flex justify-between mb-4">
          <img src="/logo.svg" alt="Logo" className="h-16 w-auto" />
          <div>
            <button 
              className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-2 px-4 rounded mr-2"
              onClick={handleCopy}
            >
              Copy
            </button>
            <button 
              className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-2 px-4 rounded"
              onClick={handleDownload}
            >
              Download
            </button>
          </div>
        </div>
        <div className="bg-[#0a0a0a]/50 p-4 mt-10 mb-10 rounded-lg text-white placeholder-white max-w-4xl w-full overflow-scroll h-[500px] border border-white rounded-lg">
          <ReactMarkdown className="overflow-scroll">{auditMarkdown}</ReactMarkdown>
        </div>
        <p className="text-center mt-4 animate-bounce bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-500">Scroll to see more of the audit report...</p>
        <div className="flex mb-10">
          <button 
            className="text-white font-bold py-2 px-4 rounded bg-gradient-to-r from-red-500 to-red-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );};

export default AuditModal;
