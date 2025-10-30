import React, { useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  setOptimizedTextInput, 
  setSelectedModel, 
  setSelectedVoice, 
  setIsLoading, 
  setError, 
  setApiKeySelected, 
  setAudioBlobUrl, 
  setCurrentStep, 
  addHistoryItem,
  setEstimatedGenerateTime,
  setCountdown,
  setIsPlaying,
  setIsDuringPlayback,
} from '../context/appActions';
import { TTS_MODELS, VOICE_OPTIONS, COLLOQUIAL_STYLE_OPTIONS } from '../constants';
import { generateSpeech } from '../services/geminiService';
import { bufferToWave } from '../utils/audioUtils';
import LoadingSpinner from './common/LoadingSpinner';
import { HistoryItem } from '../types';
import { useCountdownTimer } from '../hooks/useCountdownTimer';

const Step2Config: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { 
    originalTextInput, 
    optimizedTextInput, 
    selectedColloquialStyle,
    selectedVoice, 
    selectedModel, 
    isLoading, 
    apiKeySelected, 
    isDuringPlayback,
    audioContext,
    history,
    estimatedGenerateTime,
    countdown,
  } = state;

  const { startCountdown, clearCountdown } = useCountdownTimer();

  const disableForm = isLoading || isDuringPlayback || !apiKeySelected;

  const handlePreviousStep = useCallback(() => {
    dispatch(setCurrentStep(1));
    dispatch(setError(null));
    dispatch(setAudioBlobUrl(null));
    dispatch(setIsPlaying(false));
    dispatch(setIsDuringPlayback(false));
  }, [dispatch]);

  const handleGenerateAudio = useCallback(async () => {
    if (!optimizedTextInput.trim()) {
      dispatch(setError('请先优化文本或输入待生成语音的文本。'));
      return;
    }
    if (!audioContext) {
      dispatch(setError('音频上下文未初始化。'));
      return;
    }
    if (!apiKeySelected) {
      dispatch(setError('API 密钥未选择。请选择您的 API 密钥。'));
      return;
    }

    // Calculate estimated time (1 second per 10 characters, minimum 5 seconds)
    const length = optimizedTextInput.length;
    const estimatedMs = Math.max(5000, Math.ceil(length / 10) * 1000); 
    dispatch(setEstimatedGenerateTime(estimatedMs));
    startCountdown(estimatedMs / 1000);

    dispatch(setIsLoading(true));
    dispatch(setError(null));
    dispatch(setAudioBlobUrl(null));
    dispatch(setIsPlaying(false));
    dispatch(setIsDuringPlayback(false));


    try {
      const audioBuffer = await generateSpeech(
        optimizedTextInput,
        selectedVoice,
        selectedModel,
        audioContext,
      );

      const wavBlob = bufferToWave(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      dispatch(setAudioBlobUrl(url));
      dispatch(setCurrentStep(3)); // Move to step 3 on success

      // Save to history
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        originalText: originalTextInput,
        optimizedText: optimizedTextInput,
        voiceName: selectedVoice,
        modelName: selectedModel,
        colloquialStyleName: selectedColloquialStyle,
      };
      dispatch(addHistoryItem(newHistoryItem));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Requested entity was not found.")) {
        dispatch(setError(
          'API 密钥可能无效或权限不足。请重新选择您的 API 密钥。' +
          '(账单链接: ai.google.dev/gemini-api/docs/billing)'
        ));
        dispatch(setApiKeySelected(false)); // Assume key might be invalid
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
           window.aistudio.openSelectKey(); // Prompt user to select again
        }
      } else {
        dispatch(setError(`生成语音失败: ${errorMessage}`));
      }
    } finally {
      dispatch(setIsLoading(false));
      dispatch(setEstimatedGenerateTime(0)); // Clear estimated time
      clearCountdown(); // Clear countdown
    }
  }, [
    originalTextInput, 
    optimizedTextInput, 
    selectedColloquialStyle,
    selectedVoice, 
    selectedModel, 
    apiKeySelected, 
    audioContext, 
    dispatch, 
    history,
    startCountdown,
    clearCountdown
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-700">步骤 2: 确认优化文本与设置</h2>
      <div>
        <label htmlFor="optimized-text-input" className="block text-sm font-medium text-gray-700 mb-1">待生成语音的文本 (可编辑):</label>
        <textarea
          id="optimized-text-input"
          value={optimizedTextInput}
          onChange={(e) => dispatch(setOptimizedTextInput(e.target.value))} // Allow editing of optimized text
          placeholder="此处将显示优化后的文本，可自行修改..."
          rows={6}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y disabled:bg-gray-50 disabled:cursor-not-allowed"
          disabled={disableForm}
        ></textarea>
      </div>

      <div>
        <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-1">选择模型:</label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => dispatch(setSelectedModel(e.target.value))}
          className="block w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          disabled={disableForm}
        >
          {TTS_MODELS.map((model) => (
            <option key={model.name} value={model.name}>
              {model.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 mb-1">选择语音风格:</label>
        <select
          id="voice-select"
          value={selectedVoice}
          onChange={(e) => dispatch(setSelectedVoice(e.target.value))}
          className="block w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          disabled={disableForm}
        >
          {VOICE_OPTIONS.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4 mt-4">
        <button
          onClick={handlePreviousStep}
          disabled={isLoading || isDuringPlayback}
          className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center"
        >
          上一步
        </button>
        <button
          onClick={handleGenerateAudio}
          disabled={disableForm || !optimizedTextInput.trim()}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              生成中... {countdown > 0 ? `(预估值: ${countdown}秒)` : '(估算中)'}
            </>
          ) : (
            '确认并生成语音'
          )}
        </button>
      </div>
    </div>
  );
};

export default Step2Config;