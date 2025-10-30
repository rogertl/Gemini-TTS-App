import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateSpeech, processTextForSpeech } from './services/geminiService';
import { VOICE_OPTIONS, DEFAULT_VOICE_NAME, TTS_MODELS, DEFAULT_TTS_MODEL } from './constants';
import { AIStudio } from './types'; // Ensure AIStudio is imported if needed for local typing

// The global `window.aistudio` declaration has been moved to types.ts
// declare global {
//   interface Window {
//     aistudio?: AIStudio;
//   }
// }

const bufferToWave = (audioBuffer: AudioBuffer): Blob => {
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i, sample;
  let offset = 0;
  let pos = 0;

  function writeString(s: string) {
    for (i = 0; i < s.length; i++) {
      view.setUint8(pos++, s.charCodeAt(i));
    }
  }

  function writeUint32(d: number) {
    view.setUint32(pos, d, true);
    pos += 4;
  }

  function writeUint16(d: number) {
    view.setUint16(pos, d, true);
    pos += 2;
  }

  writeString('RIFF');
  writeUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  writeUint32(16);
  writeUint16(1);
  writeUint16(numOfChan);
  writeUint32(audioBuffer.sampleRate);
  writeUint32(audioBuffer.sampleRate * numOfChan * 2);
  writeUint16(numOfChan * 2);
  writeUint16(16);
  writeString('data');
  writeUint32(length - pos - 4);

  for (i = 0; i < numOfChan; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

function App() {
  const [originalTextInput, setOriginalTextInput] = useState<string>('');
  const [optimizedTextInput, setOptimizedTextInput] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_VOICE_NAME);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_TTS_MODEL.name);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioBlobUrl]);

  // Effect to stop playing and clear audio when original input/settings change
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }
    // Only clear error if it's not an API key error
    if (!error?.includes('API 密钥')) {
      setError(null);
    }
    // When originalTextInput or settings change, optimized text should be re-evaluated or user needs to re-optimize
    // For now, let's clear optimized text to force re-optimization or manual edit.
    setOptimizedTextInput('');
  }, [originalTextInput, selectedVoice, selectedModel]);


  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setApiKeySelected(hasKey);
          if (!hasKey) {
            setError('请选择您的 Google AI Studio API 密钥以使用此应用程序。');
          }
        } catch (e) {
          console.error("检查 API 密钥时出错:", e);
          setError('检查 API 密钥状态失败。请重试。');
          setApiKeySelected(false);
        }
      } else {
        setApiKeySelected(!!process.env.API_KEY);
        if (!process.env.API_KEY) {
          setError('API_KEY 环境变量未设置。请配置。');
        }
      }
    };
    checkApiKey();
  }, []);

  const handleSelectApiKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true);
        setError(null);
      } catch (e) {
        console.error("打开 API 密钥选择器时出错:", e);
        setError('无法打开 API 密钥选择对话框。请重试。');
        setApiKeySelected(false);
      }
    } else {
      setError('此环境中不支持 AI Studio API 密钥选择。');
    }
  };

  const handleOptimizeText = useCallback(() => {
    if (!originalTextInput.trim()) {
      setError('请输入原始文本进行优化。');
      setOptimizedTextInput('');
      return;
    }
    setError(null);
    const processed = processTextForSpeech(originalTextInput);
    setOptimizedTextInput(processed);
  }, [originalTextInput]);

  const handleGenerateAudio = async () => {
    if (!optimizedTextInput.trim()) {
      setError('请先优化文本或输入待生成语音的文本。');
      return;
    }
    if (!audioContextRef.current) {
      setError('音频上下文未初始化。');
      return;
    }
    if (!apiKeySelected) {
      setError('API 密钥未选择。请选择您的 API 密钥。');
      return;
    }

    setIsLoading(true);
    setError(null);
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }

    try {
      // Create a new GoogleGenAI instance right before making an API call
      // to ensure it always uses the most up-to-date API key from the dialog.
      const audioBuffer = await generateSpeech(
        optimizedTextInput, // Use the optimized text for generation
        selectedVoice,
        selectedModel,
        audioContextRef.current
      );

      const wavBlob = bufferToWave(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      setAudioBlobUrl(url);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Requested entity was not found.")) {
        setError(
          'API 密钥可能无效或权限不足。请重新选择您的 API 密钥。' +
          '(账单链接: ai.google.dev/gemini-api/docs/billing)'
        );
        setApiKeySelected(false);
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
           window.aistudio.openSelectKey();
        }
      } else {
        setError(`生成语音失败: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayToggle = () => {
    if (!audioRef.current || !audioBlobUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } else {
      audioRef.current.src = audioBlobUrl;
      audioRef.current.play();
    }
  };

  const handleDownloadAudio = () => {
    if (audioBlobUrl) {
      const a = document.createElement('a');
      a.href = audioBlobUrl;
      a.download = 'gemini_speech.wav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Gemini 文字转语音</h1>

      {!apiKeySelected && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative text-center">
          <p className="mb-2">请选择您的 Google AI Studio API 密钥以使用此应用程序。</p>
          <button
            onClick={handleSelectApiKey}
            className="px-6 py-2 bg-yellow-600 text-white font-semibold rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors duration-200"
          >
            选择 API 密钥
          </button>
          <p className="mt-3 text-sm text-gray-600">
            账单链接: <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ai.google.dev/gemini-api/docs/billing</a>
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="original-text-input" className="block text-sm font-medium text-gray-700 mb-1">原始文本:</label>
          <textarea
            id="original-text-input"
            value={originalTextInput}
            onChange={(e) => setOriginalTextInput(e.target.value)}
            placeholder="在此处输入或粘贴您的原始文本..."
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={!apiKeySelected || isLoading}
          ></textarea>
        </div>

        <button
          onClick={handleOptimizeText}
          disabled={!apiKeySelected || isLoading || !originalTextInput.trim()}
          className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              优化中...
            </>
          ) : (
            '口语化优化'
          )}
        </button>

        <div>
          <label htmlFor="optimized-text-input" className="block text-sm font-medium text-gray-700 mb-1">待生成语音的文本:</label>
          <textarea
            id="optimized-text-input"
            value={optimizedTextInput}
            onChange={(e) => setOptimizedTextInput(e.target.value)} // Allow editing of optimized text
            placeholder="此处将显示优化后的文本，可自行修改..."
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={!apiKeySelected || isLoading}
          ></textarea>
        </div>

        <div>
          <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-1">选择模型:</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={!apiKeySelected || isLoading}
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
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={!apiKeySelected || isLoading}
          >
            {VOICE_OPTIONS.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-4 sm:space-y-0 mt-4">
        <button
          onClick={handleGenerateAudio}
          disabled={isLoading || !optimizedTextInput.trim() || !apiKeySelected}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              生成中...
            </>
          ) : (
            '生成语音'
          )}
        </button>

        {audioBlobUrl && (
          <>
            <button
              onClick={handlePlayToggle}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? '停止播放' : '播放语音'}
            </button>
            <button
              onClick={handleDownloadAudio}
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下载音频
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-6">
          <p><strong>错误:</strong> {error}</p>
        </div>
      )}

      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
}

export default App;