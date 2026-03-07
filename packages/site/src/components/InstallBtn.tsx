import { Download, Check } from 'lucide-react';
import { useState } from 'react';

interface InstallBtnProps {
  skillId: string;
  namespace: string;
  name: string;
}

function InstallBtn({ namespace, name }: InstallBtnProps) {
  const [copied, setCopied] = useState(false);
  const command = `npx skilo add ${namespace}/${name}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm">
        {command}
      </code>
      <button
        onClick={handleCopy}
        className="px-4 py-2.5 bg-skilo-600 hover:bg-skilo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copied
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}

export default InstallBtn;
