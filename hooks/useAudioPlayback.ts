
import { useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { setError, setIsPlaying, setIsDuringPlayback } from '../context/appActions';
import { getFriendlyErrorMessage } from '../utils/errorUtils'; // Import the new utility

export const useAudioPlayback = () => {
  const { state, dispatch } = useAppContext();
  const { audioBlobUrl, isPlaying, isDuringPlayback, audioRef, audioContext } = state;

  const handlePlayToggle = useCallback(async () => {
    console.log('useAudioPlayback: handlePlayToggle called. isPlaying:', isPlaying);
    
    if (!audioRef.current) {
      console.error('useAudioPlayback: audioRef.current is null');
      dispatch(setError(getFriendlyErrorMessage('音频播放器未准备好。')));
      return;
    }
    if (!audioBlobUrl) {
      console.error('useAudioPlayback: audioBlobUrl is null');
      dispatch(setError(getFriendlyErrorMessage('没有可播放的音频。请先生成语音。')));
      return;
    }
    if (!audioContext) {
      console.error('useAudioPlayback: audioContext is null');
      dispatch(setError(getFriendlyErrorMessage('音频上下文未初始化。')));
      return;
    }

    // Ensure AudioContext is running before attempting to play
    if (audioContext.state === 'suspended') {
      console.log(`useAudioPlayback: AudioContext is ${audioContext.state}, attempting to resume...`);
      try {
        await audioContext.resume();
        console.log("useAudioPlayback: AudioContext resumed.");
      } catch (e) {
        console.error("useAudioPlayback: Failed to resume AudioContext:", e);
        dispatch(setError(getFriendlyErrorMessage(`无法激活音频播放：${e instanceof Error ? e.message : String(e)}`)));
        return;
      }
    }

    if (isPlaying) {
      // PAUSE Logic
      console.log('useAudioPlayback: Pausing audio.');
      audioRef.current.pause();
      dispatch(setIsPlaying(false));
    } else {
      // PLAY Logic
      
      // Check current src and update if needed
      const currentSrc = audioRef.current.currentSrc || audioRef.current.src || '';
      const newSrcStr = audioBlobUrl;

      // Only load if the source URL string is actually different
      if (currentSrc !== newSrcStr) {
        console.log('useAudioPlayback: Source changed. Loading new source.');
        audioRef.current.src = newSrcStr;
        audioRef.current.load(); // Explicitly load for new source
      } else {
        console.log('useAudioPlayback: Resuming existing source.');
      }

      // Try to play
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('useAudioPlayback: Playback started successfully.');
          dispatch(setIsPlaying(true));
          dispatch(setIsDuringPlayback(true));
        }).catch(playError => {
          console.error('useAudioPlayback: Error initiating audio playback:', playError);
          let errorMessage = `无法播放音频：${playError instanceof Error ? playError.message : String(playError)}。`;
          if (playError.name === "NotAllowedError" || playError.name === "AbortError") {
            errorMessage += " 这可能是由于浏览器自动播放策略限制，请尝试手动播放，或确保页面有用户交互。";
          }
          dispatch(setError(getFriendlyErrorMessage(errorMessage)));
          dispatch(setIsPlaying(false));
          dispatch(setIsDuringPlayback(false));
        });
      } else {
        // Fallback for older browsers
        console.log('useAudioPlayback: Playback started (no promise).');
        dispatch(setIsPlaying(true));
        dispatch(setIsDuringPlayback(true));
      }
    }
  }, [isPlaying, audioRef, audioBlobUrl, audioContext, dispatch]);

  const handleStopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset to start
    }
    dispatch(setIsPlaying(false));
    dispatch(setIsDuringPlayback(false));
    console.log('useAudioPlayback: Audio stopped and reset.');
  }, [audioRef, dispatch]);

  const handleAudioEnded = useCallback(() => {
    console.log('useAudioPlayback: Audio playback ended event received.');
    dispatch(setIsPlaying(false));
    dispatch(setIsDuringPlayback(false));
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [audioRef, dispatch]);

  // Attach/detach onEnded listener
  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.addEventListener('ended', handleAudioEnded);
    }
    return () => {
      if (audioEl) {
        audioEl.removeEventListener('ended', handleAudioEnded);
      }
    };
  }, [audioRef, handleAudioEnded]);

  return {
    isPlaying,
    isDuringPlayback,
    handlePlayToggle,
    handleStopPlayback,
    handleAudioEnded,
  };
};
