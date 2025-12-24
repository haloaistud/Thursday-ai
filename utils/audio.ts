import { Blob } from '@google/genai';

/**
 * Encodes a Uint8Array to a base64 string.
 */
export function base64Encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a base64 string to a Uint8Array.
 */
export function base64Decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer.
 */
export function pcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): AudioBuffer {
  const byteLength = data.byteLength - (data.byteLength % 2);
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Plays raw PCM data immediately (used for TTS).
 */
export async function playRawAudio(base64Data: string, ctx: AudioContext) {
  const bytes = base64Decode(base64Data);
  const buffer = pcmToAudioBuffer(bytes, ctx, 24000, 1);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
  return source;
}

/**
 * Downsamples audio data to target sample rate.
 */
export function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number = 16000): Float32Array {
  if (outputRate >= inputRate) return buffer;
  
  const sampleRateRatio = inputRate / outputRate;
  const newLength = Math.floor(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const nextOffset = Math.floor((i + 1) * sampleRateRatio);
    const currOffset = Math.floor(i * sampleRateRatio);
    let accum = 0;
    let count = 0;
    
    for (let j = currOffset; j < nextOffset && j < buffer.length; j++) {
      accum += buffer[j];
      count++;
    }
    result[i] = count > 0 ? accum / count : 0;
  }
  return result;
}

/**
 * Enhanced PCM conversion with sophisticated signal cleanup for better Speech Recognition.
 * Includes a software-based noise gate and signal normalization.
 */
export function float32To16BitPCM(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  
  // Advanced Signal Processing Constants
  const NOISE_GATE_THRESHOLD = 0.002; // Filters out quiet background hiss
  const NORMALIZATION_FACTOR = 1.8;   // Boosts signal for clearer AI recognition
  const SOFT_CLIP_LIMIT = 0.98;      // Prevents digital distortion

  for (let i = 0; i < l; i++) {
    let s = data[i];
    
    // 1. Noise Gate: Eliminate micro-sounds below a threshold
    if (Math.abs(s) < NOISE_GATE_THRESHOLD) {
      s = 0;
    } else {
      // 2. Gain: Boost the signal to ensure Thursday hears clearly even at low volumes
      s = s * NORMALIZATION_FACTOR;
    }
    
    // 3. Peak Limiter (Soft Clipping): Smoothly cap loud transients
    if (s > SOFT_CLIP_LIMIT) s = SOFT_CLIP_LIMIT;
    if (s < -SOFT_CLIP_LIMIT) s = -SOFT_CLIP_LIMIT;
    
    // 4. Quantization to 16-bit PCM
    int16[i] = s < 0 ? s * 32768 : s * 32767;
  }
  
  return {
    data: base64Encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}