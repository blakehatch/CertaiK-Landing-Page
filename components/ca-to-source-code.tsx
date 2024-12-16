import { useState } from 'react';
import { Input } from "@/components/ui/input"

interface SourceCodeInputProps {
  setSourceCode: (sourceCode: string) => void;
}

const SourceCodeInput: React.FC<SourceCodeInputProps> = ({ setSourceCode }) => {
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value);
  };

  const fetchSourceCode = async () => {
    if (!address) {
      setError('Please enter a valid address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/scan?address=${encodeURIComponent(address)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch source code');
      }
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSourceCode(data.sourceCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 w-[40%] mb-10">
      <Input
        type="text"
        value={address}
        onChange={handleInputChange}
        placeholder="Enter contract address to fetch source code..."
        className="shadcn-input-class text-lg w-full h-9" // Adjusted text size for readability and made input wider
      />
      <button 
        className={`bg-gradient-to-r h-9 w-48 bg-gradient-to-r from-cyan-500 z-10 to-purple-500 text-white px-10 rounded text-md ${(loading || !address) ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={fetchSourceCode}
        disabled={loading || !address}
      >
        {loading ? 'Loading...' : 'Scan'}
      </button>
      {error && <p className="text-red-500 text-lg">{error}</p>} {/* Adjusted text size for readability */}
    </div>
  );
};

export default SourceCodeInput;
