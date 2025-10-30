
import React from 'react';

interface ApiKeyPromptProps {
  onSelectApiKey: () => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onSelectApiKey }) => {
  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative text-center">
      <p className="mb-2">请选择您的 Google AI Studio API 密钥以使用此应用程序。</p>
      <button
        onClick={onSelectApiKey}
        className="px-6 py-2 bg-yellow-600 text-white font-semibold rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors duration-200"
      >
        选择 API 密钥
      </button>
      <p className="mt-3 text-sm text-gray-600">
        账单链接: <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ai.google.dev/gemini-api/docs/billing</a>
      </p>
    </div>
  );
};

export default ApiKeyPrompt;
