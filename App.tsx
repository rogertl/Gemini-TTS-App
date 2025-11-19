
import React, { useEffect } from 'react';
import { useAppContext } from './context/AppContext';
import { useApiKeyStatus } from './hooks/useApiKeyStatus';

import ApiKeyPrompt from './components/ApiKeyPrompt';
import AdvancedSettingsModal from './components/AdvancedSettingsModal';
import Step1Input from './components/Step1Input';
import Step2Config from './components/Step2Config';
import Step3Playback from './components/Step3Playback';
import HistorySection from './components/HistorySection';
import FooterInfo from './components/FooterInfo';
import ErrorModal from './components/ErrorModal'; // Import the new ErrorModal component
import { setError, setAudioBlobUrl, setIsPlaying, setIsDuringPlayback, closeErrorModal } from './context/appActions';

function App() {
  const { state, dispatch } = useAppContext();
  const { 
    currentStep, isLoading, error, apiKeySelected, 
    showAdvancedModelSettings, audioBlobUrl, isPlaying, 
    audioRef, showErrorModal, errorModalMessage 
  } = state;

  // Effect 1: Handle Playback stopping logic specifically when navigation or data changes
  // Separated from general error clearing to prevent race conditions or loops
  useEffect(() => {
    // If user leaves step 3, or if audioBlobUrl is cleared/changed externally
    const shouldStopPlayback = currentStep !== 3 || !audioBlobUrl;

    if (shouldStopPlayback) {
      if (state.isPlaying && audioRef.current) {
        audioRef.current.pause();
      }
      if (state.isPlaying) dispatch(setIsPlaying(false));
      if (state.isDuringPlayback) dispatch(setIsDuringPlayback(false));
    }

    // Cleanup URL when leaving Step 3
    if (currentStep !== 3 && audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      dispatch(setAudioBlobUrl(null));
    }
  }, [currentStep, audioBlobUrl, dispatch, audioRef, state.isPlaying, state.isDuringPlayback]);

  // Effect 2: General error clearing based on input changes
  useEffect(() => {
    // Only clear general errors if not related to API key or loading
    if (error && !error.includes('API 密钥') && !isLoading && apiKeySelected && !showErrorModal) {
      dispatch(setError(null));
    }
  }, [
    state.originalTextInput, 
    state.selectedColloquialStyle, 
    state.selectedVoice, 
    state.selectedModel, 
    dispatch, 
    apiKeySelected, 
    error, 
    isLoading, 
    showErrorModal
  ]);

  // API Key Status Check (using custom hook)
  const { apiKeySelected: hookApiKeySelected } = useApiKeyStatus(); 

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Gemini 文字转语音</h1>

      {/* API Key Selection Warning */}
      {!hookApiKeySelected && <ApiKeyPrompt />} 

      {/* Main Steps */}
      {currentStep === 1 && <Step1Input />}
      {currentStep === 2 && <Step2Config />}
      {currentStep === 3 && <Step3Playback />}

      {/* Advanced Model Settings Modal */}
      {showAdvancedModelSettings && <AdvancedSettingsModal />}

      {/* Error Modal */}
      {showErrorModal && <ErrorModal message={errorModalMessage} onClose={() => dispatch(closeErrorModal())} />}

      {/* History Section */}
      <HistorySection />

      {/* Author Info & License */}
      <FooterInfo />
    </div>
  );
}

export default App;
