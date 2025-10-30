
import React, { useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  setError, 
  setAudioBlobUrl, 
  // Removed setIsPlaying, setIsDuringPlayback as they are managed by useAudioPlayback
  restartApp, 
} from '../context/appActions';
import { COLLOQUIAL_STYLE_OPTIONS } from '../constants';
import { useAudioPlayback } from '../hooks/useAudioPlayback'; // Import the hook

const Step3Playback: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { 
    optimizedTextInput, 
    selectedColloquialStyle,
    audioBlobUrl, 
    isLoading, 
    // isPlaying, isDuringPlayback now from hook
  } = state;

  const {
    isPlaying,
    isDuringPlayback,
    handlePlayToggle,
    handleStopPlayback,
    handleAudioEnded, // This will be attached to audioRef.current by the hook
  } = useAudioPlayback();

  // Cleanup function for audioBlobUrl when it changes or component unmounts
  useEffect(() => {
    return () => {
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioBlobUrl]);

  const handleDownloadAudio = useCallback(() => {
    if (audioBlobUrl) {
      const a = document.createElement('a');
      a.href = audioBlobUrl;
      a.download = `gemini_speech_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      dispatch(setError('没有可下载的音频。请先生成语音。'));
    }
  }, [audioBlobUrl, dispatch]);

  const handleRestartApp = useCallback(() => {
    dispatch(restartApp());
  }, [dispatch]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-700">步骤 3: 播放与下载语音</h2>
      <div className="p-4 bg-blue-50 rounded-md text-gray-800 border border-blue-200">
        <p className="font-semibold text-lg mb-2">待生成语音的文本:</p>
        <div className="text-base leading-relaxed whitespace-pre-wrap mb-2">
          {optimizedTextInput}
        </div>
        {selectedColloquialStyle && (
          <p className="text-sm text-gray-600">
            口语化风格: <span className="font-medium text-gray-700">
              {COLLOQUIAL_STYLE_OPTIONS.find(s => s.name === selectedColloquialStyle)?.label || selectedColloquialStyle}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-4 sm:space-y-0 mt-4">
        <button
          onClick={handlePlayToggle}
          disabled={!audioBlobUrl || isLoading}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaying ? '暂停播放' : '播放语音'}
        </button>
        {isDuringPlayback && (
          <button
              onClick={handleStopPlayback}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
          >
              终止播放
          </button>
        )}
        <button
          onClick={handleDownloadAudio}
          disabled={!audioBlobUrl || isLoading || isPlaying}
          className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下载音频
        </button>
        <button
          onClick={handleRestartApp}
          disabled={isLoading || isDuringPlayback}
          className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          重新开始
        </button>
      </div>
    </div>
  );
};

export default Step3Playback;
