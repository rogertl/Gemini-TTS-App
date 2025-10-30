
import { GlobalAppState, AppAction, AdvancedModelConfig } from '../types';
import { DEFAULT_COLLOQUIAL_STYLE_NAME, DEFAULT_TTS_MODEL, DEFAULT_VOICE_NAME, LOCAL_STORAGE_HISTORY_KEY } from '../constants';

const loadHistoryFromLocalStorage = (): GlobalAppState['history'] => {
  try {
    const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    return storedHistory ? JSON.parse(storedHistory) : [];
  } catch (e) {
    console.error("Failed to load history from localStorage", e);
    return [];
  }
};

const initialAdvancedModelConfig: AdvancedModelConfig = {
  modelType: 'text',
  customModelName: '',
  customJsonConfig: '{}',
};

export const initialAppState: GlobalAppState = {
  currentStep: 1,
  originalTextInput: '',
  optimizedTextInput: '',
  selectedColloquialStyle: DEFAULT_COLLOQUIAL_STYLE_NAME,
  selectedVoice: DEFAULT_VOICE_NAME,
  selectedModel: DEFAULT_TTS_MODEL.name,
  isLoading: false,
  error: null,
  apiKeySelected: false,
  audioBlobUrl: null,
  history: loadHistoryFromLocalStorage(),
  showHistory: false,
  showVerbalizationTooltip: false,
  estimatedGenerateTime: 0,
  countdown: 0,
  showAdvancedModelSettings: false,
  advancedModelConfig: initialAdvancedModelConfig,
  isPlaying: false,
  isDuringPlayback: false,
  audioContext: null,
  audioRef: { current: null }, // Initialize audioRef here according to GlobalAppState type
  showErrorModal: false, // New: Default to not showing error modal
  errorModalMessage: null, // New: No error message initially
};

export const appReducer = (state: GlobalAppState, action: AppAction): GlobalAppState => {
  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_ORIGINAL_TEXT_INPUT':
      return { ...state, originalTextInput: action.payload };
    case 'SET_OPTIMIZED_TEXT_INPUT':
      return { ...state, optimizedTextInput: action.payload };
    case 'SET_SELECTED_COLLOQUIAL_STYLE':
      return { ...state, selectedColloquialStyle: action.payload };
    case 'SET_SELECTED_VOICE':
      return { ...state, selectedVoice: action.payload };
    case 'SET_SELECTED_MODEL':
      return { ...state, selectedModel: action.payload };
    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      // When setting an error, also prepare to show the modal
      return { 
        ...state, 
        error: action.payload,
        errorModalMessage: action.payload,
        showErrorModal: action.payload !== null, // Show modal if error payload is not null
      };
    case 'SET_API_KEY_SELECTED':
      return { ...state, apiKeySelected: action.payload };
    case 'SET_AUDIO_BLOB_URL':
      // Revoke previous URL if a new one is set
      if (state.audioBlobUrl && action.payload !== state.audioBlobUrl) {
        URL.revokeObjectURL(state.audioBlobUrl);
      }
      return { ...state, audioBlobUrl: action.payload };
    case 'SET_IS_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_IS_DURING_PLAYBACK':
      return { ...state, isDuringPlayback: action.payload };
    case 'SET_HISTORY':
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(action.payload));
      return { ...state, history: action.payload };
    case 'ADD_HISTORY_ITEM': {
      const updatedHistory = [action.payload, ...state.history];
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
      return { ...state, history: updatedHistory };
    }
    case 'DELETE_HISTORY_ITEM': {
      const updatedHistory = state.history.filter(item => item.id !== action.payload);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
      return { ...state, history: updatedHistory };
    }
    case 'CLEAR_ALL_HISTORY':
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
      return { ...state, history: [] };
    case 'SET_SHOW_HISTORY':
      return { ...state, showHistory: action.payload };
    case 'SET_SHOW_VERBALIZATION_TOOLTIP':
      return { ...state, showVerbalizationTooltip: action.payload };
    case 'SET_ESTIMATED_GENERATE_TIME':
      return { ...state, estimatedGenerateTime: action.payload };
    case 'SET_COUNTDOWN':
      console.log('SET_COUNTDOWN dispatched with payload:', action.payload); // Add log
      return { ...state, countdown: action.payload };
    case 'SET_SHOW_ADVANCED_MODEL_SETTINGS':
      return { ...state, showAdvancedModelSettings: action.payload };
    case 'SET_ADVANCED_MODEL_CONFIG':
      return { ...state, advancedModelConfig: action.payload };
    case 'SET_AUDIO_CONTEXT':
      return { ...state, audioContext: action.payload };
    case 'SET_SHOW_ERROR_MODAL':
      return { ...state, showErrorModal: action.payload };
    case 'SET_ERROR_MODAL_MESSAGE':
      return { ...state, errorModalMessage: action.payload };
    case 'CLOSE_ERROR_MODAL':
      return { ...state, showErrorModal: false, errorModalMessage: null, error: null }; // Also clear internal error
    case 'RESTART_APP':
      return {
        ...initialAppState,
        history: state.history, // Keep history on restart
        apiKeySelected: state.apiKeySelected, // Keep API key status
        audioRef: state.audioRef, // Preserve the audioRef
        audioContext: state.audioContext, // Preserve the AudioContext instance
      };
    default:
      return state;
  }
};
