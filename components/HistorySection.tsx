import React, { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  setShowHistory, 
  setCurrentStep, 
  setOriginalTextInput, 
  setOptimizedTextInput, 
  setSelectedColloquialStyle, 
  setSelectedVoice, 
  setSelectedModel, 
  setError, 
  setAudioBlobUrl, 
  setIsPlaying,
  setIsDuringPlayback,
  deleteHistoryItem,
  clearAllHistory,
} from '../context/appActions';
import { COLLOQUIAL_STYLE_OPTIONS } from '../constants';
import { HistoryItem } from '../types';

const HistorySection: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { history, showHistory, isLoading, isDuringPlayback } = state;

  const handleLoadHistoryItem = useCallback((item: HistoryItem) => {
    dispatch(setOriginalTextInput(item.originalText));
    dispatch(setOptimizedTextInput(item.optimizedText));
    dispatch(setSelectedColloquialStyle(item.colloquialStyleName)); 
    dispatch(setSelectedVoice(item.voiceName));
    dispatch(setSelectedModel(item.modelName));
    dispatch(setCurrentStep(2));
    dispatch(setError(null));
    dispatch(setAudioBlobUrl(null));
    dispatch(setIsPlaying(false));
    dispatch(setIsDuringPlayback(false));
  }, [dispatch]);

  const handleDeleteItem = useCallback((id: string) => {
    dispatch(deleteHistoryItem(id));
  }, [dispatch]);

  const handleClearAllHistory = useCallback(() => {
    dispatch(clearAllHistory());
  }, [dispatch]);

  return (
    <div className="mt-8">
      <button
        onClick={() => dispatch(setShowHistory(!showHistory))}
        className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors duration-200 w-full flex items-center justify-between"
        aria-expanded={showHistory}
        aria-controls="history-panel"
        disabled={isLoading || isDuringPlayback}
      >
        <span>历史记录 ({history.length} 条)</span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {showHistory && (
        <div id="history-panel" className="bg-white border border-gray-200 rounded-md p-4 mt-2 max-h-96 overflow-y-auto shadow-inner">
          {history.length === 0 ? (
            <p className="text-gray-600 text-center">暂无历史记录。</p>
          ) : (
            <ul className="space-y-4">
              {history.map((item: HistoryItem) => (
                <li key={item.id} className="p-3 border border-gray-100 rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-150 flex flex-col space-y-2">
                  <p className="text-sm text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">{item.voiceName}</span>
                    <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">{item.modelName}</span>
                    {item.colloquialStyleName && (
                        <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          {COLLOQUIAL_STYLE_OPTIONS.find(s => s.name === item.colloquialStyleName)?.label || item.colloquialStyleName}
                        </span>
                      )}
                  </p>
                  <p className="text-gray-800 text-base line-clamp-2">{item.optimizedText}</p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleLoadHistoryItem(item)}
                      className="px-3 py-1 bg-indigo-500 text-white text-sm rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || isDuringPlayback}
                    >
                      加载并重新生成
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || isDuringPlayback}
                    >
                      删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {history.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 w-full"
              disabled={isLoading || isDuringPlayback}
            >
              清空所有历史记录
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HistorySection;