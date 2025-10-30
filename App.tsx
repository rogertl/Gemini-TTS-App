import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateSpeech, optimizeTextForColloquialSpeech } from './services/geminiService';
import { 
  VOICE_OPTIONS, 
  DEFAULT_VOICE_NAME, 
  TTS_MODELS, 
  DEFAULT_TTS_MODEL,
  COLLOQUIAL_STYLE_OPTIONS,
  DEFAULT_COLLOQUIAL_STYLE_NAME,
  LOCAL_STORAGE_HISTORY_KEY
} from './constants';
import { AIStudio, HistoryItem, ColloquialStyleOption } from './types';

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
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Input, 2: Optimize/Select, 3: Playback
  const [originalTextInput, setOriginalTextInput] = useState<string>('');
  const [optimizedTextInput, setOptimizedTextInput] = useState<string>('');
  const [selectedColloquialStyle, setSelectedColloquialStyle] = useState<string>(DEFAULT_COLLOQUIAL_STYLE_NAME);
  const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_VOICE_NAME);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_TTS_MODEL.name);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // Tracks if audio is currently playing (play/pause state)
  const [isDuringPlayback, setIsDuringPlayback] = useState<boolean>(false); // True when audio is actively playing or paused, disables other interactions

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Verbalization tooltip state
  const [showVerbalizationTooltip, setShowVerbalizationTooltip] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext!)({ sampleRate: 24000 });
    }
    return () => {
      // Cleanup AudioContext on unmount
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Cleanup function for audioBlobUrl when it changes or component unmounts
    return () => {
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioBlobUrl]);

  // Effect to stop playing, clear audio when inputs or settings change, or step changes
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsDuringPlayback(false); // Stop disabling other interactions

    if (currentStep !== 3 && audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }
    
    // Only clear general errors if not related to API key or loading
    if (error && !error.includes('API 密钥') && !isLoading) {
      setError(null);
    }
  }, [originalTextInput, selectedColloquialStyle, selectedVoice, selectedModel, currentStep]);

  // Effect to load history from localStorage on component mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

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
        // Fallback for environments without window.aistudio
        setApiKeySelected(!!process.env.API_KEY);
        if (!process.env.API_KEY) {
          setError('API_KEY 环境变量未设置。请配置。');
        } else {
            setError(null); // Clear error if API_KEY is found
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

  const handleOptimizeText = useCallback(async () => {
    if (!originalTextInput.trim()) {
      setError('请输入原始文本进行优化。');
      setOptimizedTextInput('');
      return;
    }
    
    if (!apiKeySelected) {
      setError('API 密钥未选择。请选择您的 API 密钥。');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const style = COLLOQUIAL_STYLE_OPTIONS.find(s => s.name === selectedColloquialStyle);
      if (!style) {
          throw new Error('未知的口语化风格。');
      }
      const processed = await optimizeTextForColloquialSpeech(originalTextInput, style.description);
      setOptimizedTextInput(processed);
      setCurrentStep(2); // Move to step 2
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("API_KEY is not defined") || errorMessage.includes("Requested entity was not found.")) {
        setError(
          'API 密钥可能无效或权限不足。请重新选择您的 API 密钥。' +
          '(账单链接: ai.google.dev/gemini-api/docs/billing)'
        );
        setApiKeySelected(false); // Assume key might be invalid
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
           window.aistudio.openSelectKey(); // Prompt user to select again
        }
      } else {
        setError(`口语化优化失败: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [originalTextInput, apiKeySelected, selectedColloquialStyle]);

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
    handleStopPlayback();
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }

    try {
      const audioBuffer = await generateSpeech(
        optimizedTextInput,
        selectedVoice,
        selectedModel,
        audioContextRef.current,
      );

      const wavBlob = bufferToWave(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      setAudioBlobUrl(url);
      setCurrentStep(3); // Move to step 3 on success

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
      const updatedHistory = [newHistoryItem, ...history]; // Newest first
      setHistory(updatedHistory);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Requested entity was not found.")) {
        setError(
          'API 密钥可能无效或权限不足。请重新选择您的 API 密钥。' +
          '(账单链接: ai.google.dev/gemini-api/docs/billing)'
        );
        setApiKeySelected(false); // Assume key might be invalid
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
           window.aistudio.openSelectKey(); // Prompt user to select again
        }
      } else {
        setError(`生成语音失败: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayToggle = async () => {
    if (!audioRef.current || !audioBlobUrl) return;

    if (isPlaying) {
      // Pause
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Play or Resume
      audioRef.current.src = audioBlobUrl;

      // Ensure audio is loaded before playing
      if (audioRef.current.readyState < 2) { // HAVE_CURRENT_DATA or more
          await new Promise(resolve => {
              const onLoadedMetadata = () => {
                  audioRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
                  resolve(null);
              };
              audioRef.current?.addEventListener('loadedmetadata', onLoadedMetadata);
          });
      }

      audioRef.current.play();
      setIsPlaying(true);
      setIsDuringPlayback(true);
    }
  };

  const handleStopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsDuringPlayback(false);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setIsDuringPlayback(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleDownloadAudio = () => {
    if (audioBlobUrl) {
      const a = document.createElement('a');
      a.href = audioBlobUrl;
      a.download = `gemini_speech_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      setError('没有可下载的音频。请先生成语音。');
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
    setError(null);
    handleStopPlayback();
    setAudioBlobUrl(null);
  };

  const handleRestart = () => {
    setOriginalTextInput('');
    setOptimizedTextInput('');
    setSelectedColloquialStyle(DEFAULT_COLLOQUIAL_STYLE_NAME); // Reset style
    setSelectedVoice(DEFAULT_VOICE_NAME);
    setSelectedModel(DEFAULT_TTS_MODEL.name);
    setIsLoading(false);
    setError(null);
    setAudioBlobUrl(null);
    handleStopPlayback();
    setCurrentStep(1);
    // Re-check API key status on restart
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      window.aistudio.hasSelectedApiKey().then(hasKey => {
        setApiKeySelected(hasKey);
        if (!hasKey) {
          setError('请选择您的 Google AI Studio API 密钥以使用此应用程序。');
        }
      }).catch(e => {
        console.error("检查 API 密钥时出错:", e);
        setError('检查 API 密钥状态失败。请重试。');
        setApiKeySelected(false);
      });
    } else {
        setApiKeySelected(!!process.env.API_KEY);
        if (!process.env.API_KEY) {
            setError('API_KEY 环境变量未设置。请配置。');
        } else {
            setError(null); // Clear error if API_KEY is found
        }
    }
  };

  // History handlers
  const handleLoadHistoryItem = (item: HistoryItem) => {
    setOriginalTextInput(item.originalText);
    setOptimizedTextInput(item.optimizedText);
    setSelectedColloquialStyle(item.colloquialStyleName || DEFAULT_COLLOQUIAL_STYLE_NAME); // Load style, with fallback
    setSelectedVoice(item.voiceName);
    setSelectedModel(item.modelName);
    setCurrentStep(2);
    setError(null);
    handleStopPlayback();
    setAudioBlobUrl(null);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
  };

  const disableForm = isLoading || isDuringPlayback || !apiKeySelected;

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Gemini 文字转语音</h1>

      {/* API Key Selection Warning */}
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

      {/* Step 1: Original Text Input */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">步骤 1: 输入原始文本并选择口语化风格</h2>
          <div>
            <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
              <label htmlFor="original-text-input" className="block text-sm font-medium text-gray-700 relative">
                原始文本:
                <span
                  className="ml-2 text-blue-500 cursor-help"
                  onMouseEnter={() => setShowVerbalizationTooltip(true)}
                  onMouseLeave={() => setShowVerbalizationTooltip(false)}
                  aria-describedby="verbalization-rules-tooltip"
                >
                  ?
                </span>
                {showVerbalizationTooltip && (
                  <div
                    id="verbalization-rules-tooltip"
                    role="tooltip"
                    className="absolute z-10 w-64 p-3 mt-1 text-sm text-gray-700 bg-white rounded-lg shadow-lg border border-gray-200"
                    style={{ top: '100%', left: '0' }}
                  >
                    <p className="font-bold mb-1">口语化优化目标:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>将书面语或略显正式的中文文本，根据所选风格，转换为更自然、地道的口语表达。</li>
                      <li>AI 会根据风格调整语序和习惯用语，使其更符合日常对话或特定语境（如演讲、故事讲述）。</li>
                      <li>优化数字、日期、单位和百分比的表述，使其听起来更自然。</li>
                      <li>简化复杂的句子结构，去除书面语痕迹。</li>
                      <li>处理可能难以直接发音的符号或缩写，转换为易于口述的形式。</li>
                    </ul>
                    <p className="font-bold mt-2">优化方法:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>利用 Gemini 模型的强大语言理解和生成能力，结合用户选择的风格进行智能转换。</li>
                    </ul>
                  </div>
                )}
              </label>
              <span>
                字数: {originalTextInput.length} | 预估Token: {(originalTextInput.length / 2).toFixed(0)}
                <span className="ml-1 text-gray-400 cursor-help" title="Token 预估是基于简化的字符数计算，实际模型 Token 数可能有所不同。">(?)</span>
              </span>
            </div>
            <textarea
              id="original-text-input"
              value={originalTextInput}
              onChange={(e) => setOriginalTextInput(e.target.value)}
              placeholder="在此处输入或粘贴您的原始文本..."
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y disabled:bg-gray-50 disabled:cursor-not-allowed"
              disabled={disableForm}
            ></textarea>
          </div>

          {/* Colloquial Style Selection */}
          <div>
            <label htmlFor="colloquial-style-select" className="block text-sm font-medium text-gray-700 mb-1">选择口语化风格:</label>
            <select
              id="colloquial-style-select"
              value={selectedColloquialStyle}
              onChange={(e) => setSelectedColloquialStyle(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              disabled={disableForm}
            >
              {COLLOQUIAL_STYLE_OPTIONS.map((style: ColloquialStyleOption) => (
                <option key={style.name} value={style.name}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOptimizeText}
            disabled={disableForm || !originalTextInput.trim()}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full flex items-center justify-center"
          >
            {isLoading && currentStep === 1 ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                口语化优化中...
              </>
            ) : (
              '口语化优化'
            )}
          </button>
        </div>
      )}

      {/* Step 2: Optimized Text Input & Settings */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">步骤 2: 确认优化文本与设置</h2>
          <div>
            <label htmlFor="optimized-text-input" className="block text-sm font-medium text-gray-700 mb-1">待生成语音的文本 (可编辑):</label>
            <textarea
              id="optimized-text-input"
              value={optimizedTextInput}
              onChange={(e) => setOptimizedTextInput(e.target.value)} // Allow editing of optimized text
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
              onChange={(e) => setSelectedModel(e.target.value)}
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
              onChange={(e) => setSelectedVoice(e.target.value)}
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
              {isLoading && currentStep === 2 ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </>
              ) : (
                '确认并生成语音'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Playback & Download */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">步骤 3: 播放与下载语音</h2>
          <div className="p-4 bg-blue-50 rounded-md text-gray-800 border border-blue-200">
            <p className="font-semibold text-lg mb-2">待生成语音的文本:</p>
            <div className="text-base leading-relaxed whitespace-pre-wrap">
              {optimizedTextInput}
            </div>
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
              onClick={handleRestart}
              disabled={isLoading || isDuringPlayback}
              className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              重新开始
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-6">
          <p><strong>错误:</strong> {error}</p>
        </div>
      )}

      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        className="hidden"
      />

      {/* History Section */}
      <div className="mt-8">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors duration-200 w-full flex items-center justify-between"
          aria-expanded={showHistory}
          aria-controls="history-panel"
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
                {history.map((item) => (
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
                        onClick={() => handleDeleteHistoryItem(item.id)}
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
                onClick={handleClearHistory}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 w-full"
                disabled={isLoading || isDuringPlayback}
              >
                清空所有历史记录
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;