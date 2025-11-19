
import { VoiceOption } from '../types';

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
  
// Inline Worker Code for MP3 Encoding
// This avoids file path issues and ensures the worker is always available.
// Now includes robust check for lamejs global namespace.
const MP3_WORKER_CODE = `
importScripts('https://unpkg.com/lamejs@1.2.1/lame.min.js');

let encoder;
let mp3Data = [];

self.onmessage = function(e) {
  const { command, inputFrame, sampleRate, numChannels } = e.data;

  if (command === 'init') {
    try {
      // Robustly find Mp3Encoder class
      // Depending on the environment/version, it might be 'lamejs.Mp3Encoder' or 'Lame.Mp3Encoder' or just 'lamejs' if it is the class itself.
      let Mp3EncoderClass;
      
      if (typeof lamejs !== 'undefined' && lamejs.Mp3Encoder) {
        Mp3EncoderClass = lamejs.Mp3Encoder;
      } else if (typeof Lame !== 'undefined' && Lame.Mp3Encoder) {
        Mp3EncoderClass = Lame.Mp3Encoder;
      } else if (typeof self.lamejs !== 'undefined' && self.lamejs.Mp3Encoder) {
        Mp3EncoderClass = self.lamejs.Mp3Encoder;
      } else {
        throw new Error('lamejs library loaded but Mp3Encoder class not found. Globals: ' + Object.keys(self).filter(k => k.toLowerCase().includes('lame')));
      }

      // Initialize encoder (128kbps)
      encoder = new Mp3EncoderClass(numChannels, sampleRate, 128);
      mp3Data = [];
    } catch (err) {
      self.postMessage({ command: 'error', message: 'LameJS Init Failed: ' + err.message });
    }
  } else if (command === 'encode') {
    if (!encoder) return;
    try {
      // Convert Float32 to Int16
      const samples = new Int16Array(inputFrame.length);
      for (let i = 0; i < inputFrame.length; i++) {
        // Clamp values to -1..1 range before scaling to prevent overflow wrapping noise
        let s = Math.max(-1, Math.min(1, inputFrame[i]));
        samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      // encodeBuffer expects samples. For mono, just one array.
      const mp3buf = encoder.encodeBuffer(samples);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    } catch (err) {
      self.postMessage({ command: 'error', message: 'Encoding Failed: ' + err.message });
    }
  } else if (command === 'finish') {
    if (!encoder) return;
    try {
      const mp3buf = encoder.flush();
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
      self.postMessage({ command: 'end', mp3Data: mp3Data });
      encoder = null;
      mp3Data = [];
    } catch (err) {
      self.postMessage({ command: 'error', message: 'Flush Failed: ' + err.message });
    }
  }
};
`;

/**
 * Encodes an AudioBuffer to an MP3 Blob using an inline Web Worker and lamejs.
 * @param audioBuffer The AudioBuffer to encode.
 * @returns A Promise that resolves to an MP3 Blob.
 */
export const encodeAudioToMp3Blob = (audioBuffer: AudioBuffer): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!window.Worker) {
      reject(new Error('Web Workers are not supported in this browser.'));
      return;
    }

    // Create a blob for the worker code
    const workerBlob = new Blob([MP3_WORKER_CODE], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      const { command } = e.data;
      if (command === 'end') {
        const mp3Blob = new Blob(e.data.mp3Data, { type: 'audio/mpeg' });
        resolve(mp3Blob);
        worker.terminate();
        URL.revokeObjectURL(workerUrl); // Cleanup
      } else if (command === 'error') {
        reject(new Error(e.data.message));
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      }
    };

    worker.onerror = (e) => {
      reject(new Error(`Worker Error: ${e.message}`));
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };

    // Initialize
    worker.postMessage({
      command: 'init',
      sampleRate: audioBuffer.sampleRate,
      numChannels: audioBuffer.numberOfChannels,
    });

    // Process chunks
    const channelData = audioBuffer.getChannelData(0); // Mono
    const bufferSize = 1152 * 10; // Send larger chunks for efficiency
    
    for (let i = 0; i < channelData.length; i += bufferSize) {
      const end = Math.min(i + bufferSize, channelData.length);
      const inputFrame = channelData.slice(i, end);
      // Use transfer list for performance
      worker.postMessage({ command: 'encode', inputFrame }, [inputFrame.buffer]);
    }

    worker.postMessage({ command: 'finish' });
  });
};
