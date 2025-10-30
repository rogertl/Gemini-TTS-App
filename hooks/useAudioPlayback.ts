
import { useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { setError, setIsPlaying, setIsDuringPlayback } from '../context/appActions';

export const useAudioPlayback = () => {
  const { state, dispatch } = useAppContext();
  const { audioBlobUrl, isLoading, isPlaying, isDuringPlayback, audioRef, audioContext } = state;

  const handlePlayToggle = useCallback(async () => {
    console.log('useAudioPlayback: handlePlayToggle called. isPlaying:', isPlaying, 'audioBlobUrl:', audioBlobUrl);
    if (!audioRef.current) {
      console.error('useAudioPlayback: audioRef.current is null');
      dispatch(setError('音频播放器未准备好。'));
      return;
    }
    if (!audioBlobUrl) {
      console.error('useAudioPlayback: audioBlobUrl is null');
      dispatch(setError('没有可播放的音频。请先生成语音。'));
      return;
    }
    if (!audioContext) {
      console.error('useAudioPlayback: audioContext is null');
      dispatch(setError('音频上下文未初始化。'));
      return;
    }
    console.log('useAudioPlayback: audioRef.current exists. Current src:', audioRef.current.src);

    // Ensure AudioContext is running before attempting to play
    // Fix: AudioContext state does not include 'interrupted'. It can be 'suspended', 'running', or 'closed'.
    // Checking for 'suspended' is appropriate for resuming playback.
    if (audioContext.state === 'suspended') {
      console.log(`useAudioPlayback: AudioContext is ${audioContext.state}, attempting to resume for playback...`);
      try {
        await audioContext.resume();
        console.log("useAudioPlayback: AudioContext resumed.");
      } catch (e) {
        console.error("useAudioPlayback: Failed to resume AudioContext:", e);
        dispatch(setError(`无法激活音频播放：${e instanceof Error ? e.message : String(e)}。请尝试刷新页面。`));
        return;
      }
    }


    if (isPlaying) {
      audioRef.current.pause();
      dispatch(setIsPlaying(false));
      console.log('useAudioPlayback: Audio paused.');
    } else {
      audioRef.current.src = audioBlobUrl; // Ensure src is set
      audioRef.current.load(); // Explicitly call load() to ensure metadata is loaded

      // Try to play directly, as browsers often require user gesture
      // and waiting for 'loadedmetadata' can break the gesture association.
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          dispatch(setIsPlaying(true));
          dispatch(setIsDuringPlayback(true));
          console.log('useAudioPlayback: Audio playback initiated successfully.');
        }).catch(playError => {
          console.error('useAudioPlayback: Error initiating audio playback:', playError);
          dispatch(setError(`无法播放音频：${playError instanceof Error ? playError.message : String(playError)}。浏览器可能阻止了自动播放，请尝试手动操作或检查浏览器设置。`));
          dispatch(setIsPlaying(false));
          dispatch(setIsDuringPlayback(false));
        });
      } else {
        // Fallback for older browsers that don't return a Promise
        dispatch(setIsPlaying(true));
        dispatch(setIsDuringPlayback(true));
        console.log('useAudioPlayback: Audio playback initiated (no promise returned).');
      }
    }
  }, [isPlaying, audioRef, audioBlobUrl, audioContext, dispatch]);

  const handleStopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    dispatch(setIsPlaying(false));
    dispatch(setIsDuringPlayback(false));
    console.log('useAudioPlayback: Audio stopped and reset.');
  }, [audioRef, dispatch]);

  const handleAudioEnded = useCallback(() => {
    dispatch(setIsPlaying(false));
    dispatch(setIsDuringPlayback(false));
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    console.log('useAudioPlayback: Audio playback ended.');
  }, [audioRef, dispatch]);

  // Attach/detach onEnded listener
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleAudioEnded);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnded);
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