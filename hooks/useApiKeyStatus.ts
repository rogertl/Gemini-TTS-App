
import { useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { setApiKeySelected, setError } from '../context/appActions';
import { getFriendlyErrorMessage } from '../utils/errorUtils'; // Import the new utility

export const useApiKeyStatus = () => {
  const { state, dispatch } = useAppContext();
  const { apiKeySelected } = state;

  const checkApiKey = useCallback(async () => {
    // window.aistudio is implicitly available in the Google AI Studio environment
    // Its presence means the environment can manage API keys
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        dispatch(setApiKeySelected(hasKey));
        if (!hasKey) {
          dispatch(setError(getFriendlyErrorMessage('请选择您的 Google AI Studio API 密钥以使用此应用程序。')));
        } else {
          dispatch(setError(null)); // Clear error if key is found
        }
      } catch (e) {
        console.error("检查 API 密钥时出错:", e);
        dispatch(setError(getFriendlyErrorMessage('检查 API 密钥状态失败。请重试。')));
        dispatch(setApiKeySelected(false));
      }
    } else {
      // Fallback for environments without window.aistudio (e.g., local development)
      // In such cases, API_KEY must be provided as an environment variable.
      const keyExists = !!process.env.API_KEY;
      dispatch(setApiKeySelected(keyExists));
      if (!keyExists) {
        dispatch(setError(getFriendlyErrorMessage('API_KEY 环境变量未设置。请配置。')));
      } else {
          dispatch(setError(null)); // Clear error if API_KEY is found
      }
    }
  }, [dispatch]);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectApiKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        dispatch(setApiKeySelected(true));
        dispatch(setError(null)); // Clear any previous API key error
      } catch (e) {
        console.error("打开 API 密钥选择器时出错:", e);
        dispatch(setError(getFriendlyErrorMessage('无法打开 API 密钥选择对话框。请重试。')));
        dispatch(setApiKeySelected(false));
      }
    } else {
      dispatch(setError(getFriendlyErrorMessage('此环境中不支持 AI Studio API 密钥选择。请确保 API_KEY 环境变量已设置。')));
    }
  }, [dispatch]);

  return {
    apiKeySelected,
    checkApiKey,
    handleSelectApiKey,
  };
};