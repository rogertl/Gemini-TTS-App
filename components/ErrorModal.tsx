
import React from 'react';

interface ErrorModalProps {
  message: string | null;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
        <h3 id="error-modal-title" className="text-2xl font-bold text-red-700">错误</h3>
        <p className="text-gray-800 whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
