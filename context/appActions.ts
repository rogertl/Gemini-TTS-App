import { AppAction, HistoryItem, AdvancedModelConfig, AdvancedModelType } from '../types';

export const setCurrentStep = (step: number): AppAction => ({ type: 'SET_CURRENT_STEP', payload: step });
export const setOriginalTextInput = (text: string): AppAction => ({ type: 'SET_ORIGINAL_TEXT_INPUT', payload: text });
export const setOptimizedTextInput = (text: string): AppAction => ({ type: 'SET_OPTIMIZED_TEXT_INPUT', payload: text });
export const setSelectedColloquialStyle = (style: string): AppAction => ({ type: 'SET_SELECTED_COLLOQUIAL_STYLE', payload: style });
export const setSelectedVoice = (voice: string): AppAction => ({ type: 'SET_SELECTED_VOICE', payload: voice });
export const setSelectedModel = (model: string): AppAction => ({ type: 'SET_SELECTED_MODEL', payload: model });
export const setIsLoading = (isLoading: boolean): AppAction => ({ type: 'SET_IS_LOADING', payload: isLoading });
export const setError = (error: string | null): AppAction => ({ type: 'SET_ERROR', payload: error });
export const setApiKeySelected = (selected: boolean): AppAction => ({ type: 'SET_API_KEY_SELECTED', payload: selected });
export const setAudioBlobUrl = (url: string | null): AppAction => ({ type: 'SET_AUDIO_BLOB_URL', payload: url });
export const setIsPlaying = (playing: boolean): AppAction => ({ type: 'SET_IS_PLAYING', payload: playing });
export const setIsDuringPlayback = (duringPlayback: boolean): AppAction => ({ type: 'SET_IS_DURING_PLAYBACK', payload: duringPlayback });
export const setHistory = (history: HistoryItem[]): AppAction => ({ type: 'SET_HISTORY', payload: history });
export const addHistoryItem = (item: HistoryItem): AppAction => ({ type: 'ADD_HISTORY_ITEM', payload: item });
export const deleteHistoryItem = (id: string): AppAction => ({ type: 'DELETE_HISTORY_ITEM', payload: id });
export const clearAllHistory = (): AppAction => ({ type: 'CLEAR_ALL_HISTORY' });
export const setShowHistory = (show: boolean): AppAction => ({ type: 'SET_SHOW_HISTORY', payload: show });
export const setShowVerbalizationTooltip = (show: boolean): AppAction => ({ type: 'SET_SHOW_VERBALIZATION_TOOLTIP', payload: show });
export const setEstimatedGenerateTime = (time: number): AppAction => ({ type: 'SET_ESTIMATED_GENERATE_TIME', payload: time });
export const setCountdown = (seconds: number): AppAction => ({ type: 'SET_COUNTDOWN', payload: seconds });
export const setShowAdvancedModelSettings = (show: boolean): AppAction => ({ type: 'SET_SHOW_ADVANCED_MODEL_SETTINGS', payload: show });
export const setAdvancedModelConfig = (config: AdvancedModelConfig): AppAction => ({ type: 'SET_ADVANCED_MODEL_CONFIG', payload: config });
export const setAdvancedModelType = (modelType: AdvancedModelType): AppAction => ({ 
    type: 'SET_ADVANCED_MODEL_CONFIG', 
    payload: { ...initialAppState.advancedModelConfig, modelType } 
}); // Simplified for now
export const setAdvancedCustomModelName = (name: string): AppAction => ({ 
    type: 'SET_ADVANCED_MODEL_CONFIG', 
    payload: { ...initialAppState.advancedModelConfig, customModelName: name } 
}); // Simplified for now
export const setAdvancedCustomJsonConfig = (json: string): AppAction => ({ 
    type: 'SET_ADVANCED_MODEL_CONFIG', 
    payload: { ...initialAppState.advancedModelConfig, customJsonConfig: json } 
}); // Simplified for now
export const setAudioContext = (context: AudioContext | null): AppAction => ({ type: 'SET_AUDIO_CONTEXT', payload: context });
export const restartApp = (): AppAction => ({ type: 'RESTART_APP' });

import { initialAppState } from './appReducer'; // Import here to avoid circular dependency
