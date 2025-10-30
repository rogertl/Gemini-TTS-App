
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

  // Effect to stop playing, clear audio when inputs or settings change, or step changes
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
    dispatch(setIsPlaying(false));
    dispatch(setIsDuringPlayback(false)); // Stop disabling other interactions

    if (currentStep !== 3 && audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      dispatch(setAudioBlobUrl(null));
    }
    
    // Only clear general errors if not related to API key or loading
    // Re-check `error` state against `apiKeySelected` and `isLoading` for more precise clearing.
    // If errorModalMessage is present, don't clear the generic error prematurely.
    if (error && !error.includes('API 密钥') && !isLoading && apiKeySelected && !showErrorModal) {
      dispatch(setError(null));
    }
  }, [state.originalTextInput, state.selectedColloquialStyle, state.selectedVoice, state.selectedModel, currentStep, audioBlobUrl, isPlaying, isLoading, error, dispatch, audioRef, apiKeySelected, showErrorModal]);


  // API Key Status Check (using custom hook)
  const { handleSelectApiKey } = useApiKeyStatus();

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Gemini 文字转语音</h1>

      {/* API Key Selection Warning */}
      {!apiKeySelected && <ApiKeyPrompt onSelectApiKey={handleSelectApiKey} />}

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
