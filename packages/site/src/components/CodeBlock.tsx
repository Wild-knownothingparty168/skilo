interface CodeBlockProps {
  code: string;
  output?: string;
  language?: string;
}

function CodeBlock({ code, output, language = 'bash' }: CodeBlockProps) {
  return (
    <div className="rounded-xl bg-gray-900 text-gray-100 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-800">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-2 text-xs text-gray-500 font-mono">{language}</span>
      </div>
      <div className="p-4 font-mono text-sm">
        <div className="flex items-start gap-2">
          <span className="text-skilo-400 select-none">$</span>
          <span>{code}</span>
        </div>
        {output && (
          <div className="mt-2 text-gray-400">
            {output}
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeBlock;
