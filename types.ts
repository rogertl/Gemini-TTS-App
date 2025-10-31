
import React from 'react';

export interface VoiceOption {
  name: string;
  label: string;
}

export interface TTSModelOption {
  name: string;
  label: string;
}

export interface ColloquialStyleOption {
  name: string;
  label: string;
  description: string; // Used to guide the AI
}

export interface HistoryItem {
  id: string; // Unique ID for each history entry
  timestamp: number; // For sorting
  originalText: string;
  optimizedText: string;
  voiceName: string;
  modelName: string;
  colloquialStyleName: string; // New field for colloquial style
}

export type AdvancedModelType = 'text' | 'image' | 'video' | 'custom';

// Interface for advanced model configuration state (not directly used for API calls yet)
export interface AdvancedModelConfig {
  modelType: AdvancedModelType;
  customModelName: string;
  customJsonConfig: string;
}

declare global {
  interface Window {
    // Rely on the Google AI Studio environment to provide 'aistudio' types implicitly.
    // Explicitly defining it here often causes "Subsequent property declarations must have the same type" errors
    // if the environment already defines it.
    webkitAudioContext?: typeof AudioContext; // For broader browser compatibility
  }
}

// Global App State Type
export interface GlobalAppState {
  currentStep: number;
  originalTextInput: string;
  optimizedTextInput: string;
  selectedColloquialStyle: string;
  selectedVoice: string;
  selectedModel: string;
  isLoading: boolean;
  error: string | null;
  apiKeySelected: boolean;
  audioBlobUrl: string | null;
  history: HistoryItem[];
  showHistory: boolean;
  showVerbalizationTooltip: boolean;
  estimatedGenerateTime: number;
  countdown: number;
  showAdvancedModelSettings: boolean;
  advancedModelConfig: AdvancedModelConfig;
  isPlaying: boolean;
  isDuringPlayback: boolean;
  audioContext: AudioContext | null; // Added to manage AudioContext centrally
  audioRef: React.RefObject<HTMLAudioElement>; // Add audioRef to GlobalAppState
  showErrorModal: boolean; // New: Controls visibility of error modal
  errorModalMessage: string | null; // New: Message for the error modal
}

// Action Types for Reducer
export type AppAction =
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_ORIGINAL_TEXT_INPUT'; payload: string }
  | { type: 'SET_OPTIMIZED_TEXT_INPUT'; payload: string }
  | { type: 'SET_SELECTED_COLLOQUIAL_STYLE'; payload: string }
  | { type: 'SET_SELECTED_VOICE'; payload: string }
  | { type: 'SET_SELECTED_MODEL'; payload: string }
  | { type: 'SET_IS_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null } // This action will now also trigger the modal
  | { type: 'SET_API_KEY_SELECTED'; payload: boolean }
  | { type: 'SET_AUDIO_BLOB_URL'; payload: string | null }
  | { type: 'SET_IS_PLAYING'; payload: boolean }
  | { type: 'SET_IS_DURING_PLAYBACK'; payload: boolean }
  | { type: 'SET_HISTORY'; payload: HistoryItem[] }
  | { type: 'ADD_HISTORY_ITEM'; payload: HistoryItem }
  | { type: 'DELETE_HISTORY_ITEM'; payload: string }
  | { type: 'CLEAR_ALL_HISTORY' }
  | { type: 'SET_SHOW_HISTORY'; payload: boolean }
  | { type: 'SET_SHOW_VERBALIZATION_TOOLTIP'; payload: boolean }
  | { type: 'SET_ESTIMATED_GENERATE_TIME'; payload: number }
  | { type: 'SET_COUNTDOWN'; payload: number }
  | { type: 'SET_SHOW_ADVANCED_MODEL_SETTINGS'; payload: boolean }
  | { type: 'SET_ADVANCED_MODEL_CONFIG'; payload: AdvancedModelConfig }
  | { type: 'SET_AUDIO_CONTEXT'; payload: AudioContext | null }
  | { type: 'SET_SHOW_ERROR_MODAL'; payload: boolean } // New action
  | { type: 'SET_ERROR_MODAL_MESSAGE'; payload: string | null } // New action
  | { type: 'CLOSE_ERROR_MODAL' } // New action
  | { type: 'RESTART_APP' };

export {}; // Ensures this file is treated as a module.