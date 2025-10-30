// Function to convert an AudioBuffer to a WAV Blob
export const bufferToWave = (audioBuffer: AudioBuffer): Blob => {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let i, sample;
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
  