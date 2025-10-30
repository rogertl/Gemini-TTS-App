import { useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { setApiKeySelected, setError } from '../context/appActions';

export const useApiKeyStatus = () => {
  const { state, dispatch } = useAppContext();
  const { apiKeySelected } = state;

  const checkApiKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        dispatch(setApiKeySelected(hasKey));
        if (!hasKey) {
          dispatch(setError('请选择您的 Google AI Studio API 密钥以使用此应用程序。'));
        } else {
          dispatch(setError(null)); // Clear error if key is found
        }
      } catch (e) {
        console.error("检查 API 密钥时出错:", e);
        dispatch(setError('检查 API 密钥状态失败。请重试。'));
        dispatch(setApiKeySelected(false));
      }
    } else {
      // Fallback for environments without window.aistudio
      const keyExists = !!process.env.API_KEY;
      dispatch(setApiKeySelected(keyExists));
      if (!keyExists) {
        dispatch(setError('API_KEY 环境变量未设置。请配置。'));
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
        dispatch(setError(null));
      } catch (e) {
        console.error("打开 API 密钥选择器时出错:", e);
        dispatch(setError('无法打开 API 密钥选择对话框。请重试。'));
        dispatch(setApiKeySelected(false));
      }
    } else {
      dispatch(setError('此环境中不支持 AI Studio API 密钥选择。'));
    }
  }, [dispatch]);

  return {
    apiKeySelected,
    checkApiKey,
    handleSelectApiKey,
  };
};