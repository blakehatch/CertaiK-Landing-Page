"use client";

import { useState } from "react";
import Image from "next/image";

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
      <div className="relative z-10 mt-20 px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-cyan-400">
          Upload Your Code for Audit
        </h1>
        <div className="flex flex-col items-center">
          <input
            type="file"
            accept=".js,.jsx,.ts,.tsx,.json"
            onChange={handleFileUpload}
            className="mb-4"
          />
          {fileContent && (
            <pre className="bg-[#0a0a0a]/70 p-4 rounded-lg text-gray-300 max-w-4xl w-full overflow-auto">
              {fileContent}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}
