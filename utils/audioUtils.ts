// Function to convert an AudioBuffer to a WAV Blob
export const bufferToWave = (audioBuffer: AudioBuffer): Blob => {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    let channels: Float32Array[] = [];
    let i: number, sample: number;
    let offset = 0;
    let pos = 0;
  
    function writeString(s: string) {
      for (i = 0; i < s.length; i++) {
        view.setUint8(pos++, s.charCodeAt(i));
      }
    }
  
    function writeUint32(d: number) {
      view.setUint32(pos, d, true);
      pos += 4;
    }
  
    function writeUint16(d: number) {
      view.setUint16(pos, d, true);
      pos += 2;
    }
  
    writeString('RIFF');
    writeUint32(length - 8);
    writeString('WAVE');
    writeString('fmt ');
    writeUint32(16);
    writeUint16(1);
    writeUint16(numOfChan);
    writeUint32(audioBuffer.sampleRate);
    writeUint32(audioBuffer.sampleRate * numOfChan * 2);
    writeUint16(numOfChan * 2);
    writeUint16(16);
    writeString('data');
    writeUint32(length - pos - 4);
  
    for (i = 0; i < numOfChan; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
  
    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
  
    return new Blob([buffer], { type: 'audio/wav' });
  };
  
/**
 * Encodes an AudioBuffer to an MP3 Blob using a Web Worker and lamejs.
 * @param audioBuffer The AudioBuffer to encode.
 * @returns A Promise that resolves to an MP3 Blob.
 */
export const encodeAudioToMp3Blob = (audioBuffer: AudioBuffer): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!window.Worker) {
      const errorMessage = 'Web Workers are not supported in this browser. MP3 encoding unavailable.';
      console.error(`[Main Thread] ${errorMessage}`);
      reject(new Error(errorMessage));
      return;
    }

    console.log('[Main Thread] Starting MP3 encoding with Web Worker...');
    // Worker path (assuming 'mp3-encoder-worker.js' is in the public root)
    const worker = new Worker('mp3-encoder-worker.js'); 

    worker.onmessage = (e) => {
      console.log('[Main Thread] Received worker message:', e.data.command);
      if (e.data.command === 'end') {
        const mp3Blob = new Blob(e.data.mp3Data, { type: 'audio/mpeg' });
        console.log(`[Main Thread] MP3 encoding successful. Blob size: ${mp3Blob.size} bytes, chunks: ${e.data.mp3Data.length}`);
        resolve(mp3Blob);
        worker.terminate();
      } else if (e.data.command === 'error') { // Handle errors sent from the worker
        const errorMessage = `MP3 encoding worker reported error: ${e.data.message}`;
        console.error(`[Main Thread] ${errorMessage}`);
        reject(new Error(errorMessage));
        worker.terminate();
      }
    };

    worker.onerror = (e) => {
      const errorMessage = `MP3 encoding worker encountered an unhandled error: ${e.message || 'Unknown error'}. Check worker script path and browser console for details.`;
      console.error(`[Main Thread] ${errorMessage}`, e);
      reject(new Error(errorMessage));
      worker.terminate();
    };

    // Initialize worker
    worker.postMessage({
      command: 'init',
      sampleRate: audioBuffer.sampleRate,
      numChannels: audioBuffer.numberOfChannels,
    });
    console.log(`[Main Thread] Worker init command sent. Sample Rate: ${audioBuffer.sampleRate}, Channels: ${audioBuffer.numberOfChannels}`);

    // Process audio buffer in chunks
    // TTS output is mono, so we get channel 0.
    const channelData = audioBuffer.getChannelData(0); 
    const bufferSize = 1152; // Optimal MP3 frame size for lamejs
    console.log(`[Main Thread] Processing audio buffer in chunks. Total samples: ${channelData.length}, Buffer Size: ${bufferSize}`);

    for (let i = 0; i < channelData.length; i += bufferSize) {
      const inputFrame = channelData.slice(i, i + bufferSize);
      // Use transfer list to move Float32Array to worker, improving performance
      // inputFrame is already a copy from slice(), so transferring its buffer is safe.
      worker.postMessage({ command: 'encode', inputFrame: inputFrame }, [inputFrame.buffer]);
    }
    console.log(`[Main Thread] All audio chunks sent to worker.`);

    // Tell worker to finish encoding and flush remaining data
    worker.postMessage({ command: 'finish' });
    console.log(`[Main Thread] Worker finish command sent.`);
  });
};