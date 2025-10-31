import { useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { setApiKeySelected } from '../context/appActions';

export const useApiKeyStatus = () => {
  const { state, dispatch } = useAppContext();
  const { apiKeySelected } = state;

  const checkApiKey = useCallback(() => {
    // For local use, rely solely on process.env.API_KEY
    const keyExists = !!process.env.API_KEY;
    dispatch(setApiKeySelected(keyExists));
    console.log(`API Key status: ${keyExists ? 'exists' : 'not found in process.env.API_KEY'}`);
  }, [dispatch]);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  // handleSelectApiKey is no longer needed as there's no UI for selection in local setup
  // It's kept as a no-op function for compatibility if called elsewhere, but ideally removed from usage.
  const handleSelectApiKey = useCallback(() => {
    console.warn("handleSelectApiKey called, but is not functional in local environment. Please set process.env.API_KEY.");
  }, []);

  return {
    apiKeySelected,
    checkApiKey,
    handleSelectApiKey, // Still return for now, but should be removed from call sites
  };
};