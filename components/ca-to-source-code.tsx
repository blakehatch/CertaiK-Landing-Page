import { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from './ui/button';

interface SourceCodeInputProps {
  setSourceCode: (sourceCode: string) => void;
}

const SourceCodeInput: React.FC<SourceCodeInputProps> = ({ setSourceCode }) => {
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value);
    setError(null);
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
      <div className="flex items-center space-x-2 w-[40%] pb-8 relative mb-2">
        <Input
          type="text"
          value={address}
          onChange={handleInputChange}
          placeholder="Enter contract address to fetch source code..."
          className="text-lg w-full h-9"
        />
        <Button 
          onClick={fetchSourceCode}
          disabled={loading || !address}
          variant='bright'
        >
          {loading ? 'Loading...' : 'Scan'}
        </Button>
        {error && <p className="text-red-500 text-lg absolute left-0 bottom-0">{error}</p>}
      </div>
  );
};

export default SourceCodeInput;
