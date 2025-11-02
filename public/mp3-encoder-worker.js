// This worker script uses lamejs to encode audio data to MP3.
// It is dynamically loaded by utils/audioUtils.ts

// Import lamejs from a CDN for direct access within the worker
importScripts('https://unpkg.com/lamejs@1.2.1/lame.min.js');

let encoder;
let sampleRate;
let numChannels;
let mp3Data = [];

// Helper to send errors back to the main thread
function sendError(message) {
  self.postMessage({ command: 'error', message: message });
}

self.onmessage = function(e) {
  const { command, inputFrame, sampleRate: sr, numChannels: nc } = e.data;

  console.log(`[MP3 Worker] Received command: ${command}`); // Log command

  switch (command) {
    case 'init':
      try {
        sampleRate = sr;
        numChannels = nc;
        // Initialize Lame.Mp3Encoder with 128 kbps bitrate
        // lamejs expects sampleRate, numChannels, bitrate
        encoder = new Lame.Mp3Encoder(numChannels, sampleRate, 128); 
        mp3Data = [];
        console.log(`[MP3 Worker] Initialized with sampleRate: ${sampleRate}, numChannels: ${numChannels}, bitrate: 128`);
      } catch (error) {
        sendError(`Lame.Mp3Encoder initialization failed: ${error.message}`);
        return; // Stop further processing if initialization fails
      }
      break;

    case 'encode':
      if (!encoder) {
        sendError('Encoder not initialized before encode command. Aborting.');
        return;
      }
      try {
        // inputFrame is a Float32Array. lamejs encodeBuffer expects Int16Array.
        // If it's multi-channel, you'd need `inputFrame.slice` for each channel
        // and `encoder.encodeBuffer(channel1_samples, channel2_samples)`.
        // Since TTS output is mono (numChannels = 1), we use it directly.
        const samples = new Int16Array(inputFrame.length);
        for (let i = 0; i < inputFrame.length; i++) {
          // Convert float to 16-bit integer, clamp values to [-1, 1]
          samples[i] = Math.max(-1, Math.min(1, inputFrame[i])) * 32767; 
        }

        const mp3buf = encoder.encodeBuffer(samples);
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
          // console.log(`[MP3 Worker] Encoded ${mp3buf.length} bytes.`);
        }
      } catch (error) {
        sendError(`MP3 encoding failed during encodeBuffer: ${error.message}`);
        return; // Stop further processing if encoding fails
      }
      break;

    case 'finish':
      if (!encoder) {
        sendError('Encoder not initialized before finish command. Aborting.');
        return;
      }
      try {
        // Flush any remaining data in the encoder
        const mp3bufFinal = encoder.flush();
        if (mp3bufFinal.length > 0) {
          mp3Data.push(mp3bufFinal);
          // console.log(`[MP3 Worker] Flushed ${mp3bufFinal.length} bytes.`);
        }
        // Send all collected MP3 data back to the main thread
        self.postMessage({ command: 'end', mp3Data: mp3Data });
        console.log(`[MP3 Worker] Finished encoding. Total MP3 chunks: ${mp3Data.length}`);
      } catch (error) {
        sendError(`MP3 flush failed: ${error.message}`);
      } finally {
        encoder = null;
        mp3Data = []; // Clear data to free memory
      }
      break;
  }
};