
import React, { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  setOriginalTextInput, 
  setSelectedColloquialStyle, 
  setCurrentStep, 
  setIsLoading, 
  setError, 
  setApiKeySelected, 
  setShowVerbalizationTooltip,
  setShowAdvancedModelSettings,
  setOptimizedTextInput, 
} from '../context/appActions';
import { COLLOQUIAL_STYLE_OPTIONS } from '../constants';
import { optimizeTextForColloquialSpeech } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import Tooltip from './common/Tooltip';
import { ColloquialStyleOption } from '../types';

const Step1Input: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { 
    originalTextInput, 
    selectedColloquialStyle, 
    isLoading, 
    apiKeySelected, 
    showVerbalizationTooltip, 
    isDuringPlayback 
  } = state;

  const disableForm = isLoading || isDuringPlayback || !apiKeySelected;

  const handleOptimizeText = useCallback(async () => {
    if (!originalTextInput.trim()) {
      dispatch(setError('请输入原始文本进行优化。'));
      return;
    }
    
    if (!apiKeySelected) {
      dispatch(setError('API 密钥未选择。请选择您的 API 密钥。'));
      return;
    }

    dispatch(setIsLoading(true));
    dispatch(setError(null));

    try {
      const style = COLLOQUIAL_STYLE_OPTIONS.find(s => s.name === selectedColloquialStyle);
      if (!style) {
          throw new Error('未知的口语化风格。');
      }
      const processed = await optimizeTextForColloquialSpeech(originalTextInput, style.description);
      dispatch(setOptimizedTextInput(processed));
      dispatch(setCurrentStep(2)); // Move to step 2
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("API_KEY is not defined") || errorMessage.includes("Requested entity was not found.")) {
        dispatch(setError(
          'API 密钥可能无效或权限不足。请重新选择您的 API 密钥。' +
          '(账单链接: ai.google.dev/gemini-api/docs/billing)'
        ));
        dispatch(setApiKeySelected(false)); // Assume key might be invalid
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
           window.aistudio.openSelectKey(); // Prompt user to select again
        }
      } else {
        dispatch(setError(`口语化优化失败: ${errorMessage}`));
      }
    } finally {
      dispatch(setIsLoading(false));
    }
  }, [originalTextInput, apiKeySelected, selectedColloquialStyle, dispatch]);

  const verbalizationTooltipContent = (
    <>
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
        <li>输出将包含自然的中文断句标点符号，但不会有 Markdown 或其他无关符号。</li>
      </ul>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">步骤 1: 输入原始文本并选择口语化风格</h2>
        {/* Advanced Model Settings Icon */}
        <button
          onClick={() => dispatch(setShowAdvancedModelSettings(true))}
          className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md"
          disabled={isLoading || isDuringPlayback}
          title="高级模型配置 (预留)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </button>
      </div>

      <div>
        <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
          <label htmlFor="original-text-input" className="block text-sm font-medium text-gray-700 relative">
            原始文本:
            <span
              className="ml-2 text-blue-500 cursor-help"
              onMouseEnter={() => dispatch(setShowVerbalizationTooltip(true))}
              onMouseLeave={() => dispatch(setShowVerbalizationTooltip(false))}
              aria-describedby="verbalization-rules-tooltip"
            >
              ?
            </span>
            <Tooltip
              id="verbalization-rules-tooltip"
              show={showVerbalizationTooltip}
              content={verbalizationTooltipContent}
            />
          </label>
          <span>
            字数: {originalTextInput.length} | 预估Token: {(originalTextInput.length / 2).toFixed(0)}
            <span className="ml-1 text-gray-400 cursor-help" title="Token 预估是基于简化的字符数计算，实际模型 Token 数可能有所不同。">(?)</span>
          </span>
        </div>
        <textarea
          id="original-text-input"
          value={originalTextInput}
          onChange={(e) => dispatch(setOriginalTextInput(e.target.value))}
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
          onChange={(e) => dispatch(setSelectedColloquialStyle(e.target.value))}
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
        {isLoading && state.currentStep === 1 ? (
          <>
            <LoadingSpinner />
            口语化优化中...
          </>
        ) : (
          '口语化优化'
        )}
      </button>
    </div>
  );
};

export default Step1Input;
