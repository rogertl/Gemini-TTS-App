import React from 'react';

// Removed onSelectApiKey prop as it's no longer used
interface ApiKeyPromptProps {
  // onSelectApiKey: () => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = () => {
  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative text-center">
      <p className="mb-2">请将您的 Google Gemini API 密钥作为 <code className="font-mono bg-yellow-200 px-1 rounded text-yellow-800">API_KEY</code> 环境变量配置到您的运行环境中。</p>
      <p className="mt-3 text-sm text-gray-600">
        账单链接: <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ai.google.dev/gemini-api/docs/billing</a>
      </p>
    </div>
  );
};

export default ApiKeyPrompt;