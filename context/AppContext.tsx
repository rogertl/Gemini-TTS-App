
import React, { createContext, useReducer, useContext, useRef, ReactNode, useEffect } from 'react';
import { appReducer, initialAppState } from './appReducer';
import { GlobalAppState, AppAction } from '../types';

interface AppContextType {
  state: GlobalAppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const internalAudioContextRef = useRef<AudioContext | null>(null); // New ref for AudioContext instance

  // Initialize AudioContext only once and persist it through a ref
  useEffect(() => {
    // If we don't have an AudioContext instance yet in our internal ref
    if (!internalAudioContextRef.current) {
      try {
        const newAudioContext = new (window.AudioContext || window.webkitAudioContext!)({ sampleRate: 24000 });
        internalAudioContextRef.current = newAudioContext; // Store it in the ref
        dispatch({ type: 'SET_AUDIO_CONTEXT', payload: newAudioContext }); // Also update the state for components to consume
        console.log("AudioContext created and stored in ref/state:", newAudioContext);
      } catch (e) {
        console.error("Failed to initialize AudioContext:", e);
        dispatch({ type: 'SET_ERROR_MODAL_MESSAGE', payload: "无法初始化音频播放。请确保您的浏览器支持Web Audio API。" });
        dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
        dispatch({ type: 'SET_ERROR', payload: "无法初始化音频播放" }); // For internal state tracking
      }
    }

    return () => {
      // Cleanup: Close the AudioContext when AppProvider unmounts
      if (internalAudioContextRef.current && internalAudioContextRef.current.state !== 'closed') {
        console.log("Closing AudioContext during AppProvider unmount.");
        internalAudioContextRef.current.close();
        internalAudioContextRef.current = null; // Clear the ref
        dispatch({ type: 'SET_AUDIO_CONTEXT', payload: null }); // Clear from state
      }
    };
  }, [dispatch]); // Only dispatch as dependency, as internal ref manages instance

  const contextValue = React.useMemo(() => ({
    state: { ...state, audioRef: audioRef },
    dispatch,
  }), [state, dispatch, audioRef]);

  return (
    <AppContext.Provider value={contextValue as AppContextType}>
      {children}
      <audio 
        ref={audioRef} 
        onEnded={() => dispatch({ type: 'SET_IS_PLAYING', payload: false })} 
        onError={(e) => {
          console.error("Audio playback error:", e);
          dispatch({ type: 'SET_ERROR_MODAL_MESSAGE', payload: `音频播放失败: ${e.type}` });
          dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
          dispatch({ type: 'SET_ERROR', payload: `音频播放失败: ${e.type}` }); // For internal state tracking
          dispatch({ type: 'SET_IS_PLAYING', payload: false });
          dispatch({ type: 'SET_IS_DURING_PLAYBACK', payload: false });
        }}
        className="hidden" 
      />
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
