export type ChineseSpeechResult = {
  ok: boolean;
  voiceName?: string;
  reason?: 'unsupported' | 'voice-unavailable' | 'playback-error';
};

type ToneRecording = {
  context: AudioContext;
  buffer: AudioBuffer;
  segments: Array<{ start: number; duration: number }>;
};

const TONE_RECORDING_URL = '/before/audio/ma-four-tones.ogg';
let toneRecordingPromise: Promise<ToneRecording> | null = null;
let activeToneSource: AudioBufferSourceNode | null = null;
let activeMandarinClip: HTMLAudioElement | null = null;

export async function playMandarinClip(clipId: string): Promise<ChineseSpeechResult> {
  if (typeof window === 'undefined' || typeof Audio === 'undefined' || !/^[a-z0-9-]+$/.test(clipId)) {
    return { ok: false, reason: 'unsupported' };
  }
  try {
    activeMandarinClip?.pause();
    const audio = new Audio(`/before/audio/mandarin/${clipId}.wav`);
    audio.preload = 'auto';
    audio.volume = 1;
    activeMandarinClip = audio;
    audio.onended = () => { if (activeMandarinClip === audio) activeMandarinClip = null; };
    await audio.play();
    return { ok: true, voiceName: 'Microsoft Huihui · 중국 본토 표준어 고정 음원' };
  } catch {
    if (activeMandarinClip) activeMandarinClip = null;
    return { ok: false, reason: 'playback-error' };
  }
}

function findToneSegments(buffer: AudioBuffer) {
  const samples = buffer.getChannelData(0);
  const frameSize = Math.max(1, Math.floor(buffer.sampleRate * 0.01));
  const levels: number[] = [];

  for (let offset = 0; offset < samples.length; offset += frameSize) {
    let energy = 0;
    const end = Math.min(offset + frameSize, samples.length);
    for (let index = offset; index < end; index += 1) energy += samples[index] ** 2;
    levels.push(Math.sqrt(energy / (end - offset)));
  }

  const peak = Math.max(...levels);
  const threshold = Math.max(0.006, peak * 0.07);
  const raw: Array<{ start: number; end: number }> = [];
  let startFrame: number | null = null;

  for (let index = 0; index <= levels.length; index += 1) {
    const sounding = index < levels.length && levels[index] >= threshold;
    if (sounding && startFrame === null) startFrame = index;
    if (!sounding && startFrame !== null) {
      raw.push({ start: startFrame * 0.01, end: index * 0.01 });
      startFrame = null;
    }
  }

  const merged: typeof raw = [];
  for (const segment of raw) {
    const previous = merged.at(-1);
    if (previous && segment.start - previous.end < 0.14) previous.end = segment.end;
    else merged.push({ ...segment });
  }

  const strongest = merged
    .filter((segment) => segment.end - segment.start >= 0.18)
    .sort((a, b) => (b.end - b.start) - (a.end - a.start))
    .slice(0, 4)
    .sort((a, b) => a.start - b.start);

  const selected = strongest.length === 4
    ? strongest
    : Array.from({ length: 4 }, (_, index) => ({
        start: index * (buffer.duration / 4),
        end: (index + 1) * (buffer.duration / 4),
      }));

  return selected.map(({ start, end }) => {
    const paddedStart = Math.max(0, start - 0.045);
    const paddedEnd = Math.min(buffer.duration, end + 0.055);
    return { start: paddedStart, duration: paddedEnd - paddedStart };
  });
}

async function loadToneRecording(): Promise<ToneRecording> {
  if (toneRecordingPromise) return toneRecordingPromise;
  toneRecordingPromise = (async () => {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) throw new Error('audio-context-unavailable');
    const context = new AudioContextClass();
    await context.resume();
    const response = await fetch(TONE_RECORDING_URL);
    if (!response.ok) throw new Error('tone-recording-unavailable');
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    return { context, buffer, segments: findToneSegments(buffer) };
  })();
  return toneRecordingPromise;
}

export async function playMandarinTone(toneIndex: number): Promise<ChineseSpeechResult> {
  if (typeof window === 'undefined' || toneIndex < 0 || toneIndex > 3) {
    return { ok: false, reason: 'unsupported' };
  }

  try {
    const recording = await loadToneRecording();
    await recording.context.resume();
    activeToneSource?.stop();
    const source = recording.context.createBufferSource();
    const segment = recording.segments[toneIndex];
    source.buffer = recording.buffer;
    source.connect(recording.context.destination);
    source.start(0, segment.start, segment.duration);
    activeToneSource = source;
    source.onended = () => {
      if (activeToneSource === source) activeToneSource = null;
      source.disconnect();
    };
    return { ok: true, voiceName: '표준 중국어 mā·má·mǎ·mà 검증 녹음' };
  } catch {
    return { ok: false, reason: 'unsupported' };
  }
}

type VoiceLike = Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'default'>;

const preferredMainlandNames = /xiaoxiao|xiaoyi|yunxi|yunyang|huihui|yaoyao|kangkang|putonghua|mandarin|mainland|china|普通话/i;
const excludedNames = /cantonese|hong kong|taiwan|yue/i;

export function selectMandarinVoice<T extends VoiceLike>(voices: T[]): T | null {
  const ranked = voices
    .map((voice) => {
      const lang = voice.lang.toLowerCase().replaceAll('_', '-');
      const name = voice.name.toLowerCase();
      if (lang.startsWith('zh-hk') || lang.startsWith('zh-tw') || lang.startsWith('yue') || excludedNames.test(name)) {
        return { voice, score: -1 };
      }

      let score = 0;
      if (lang === 'zh-cn') score = 100;
      else if (lang === 'zh-hans-cn') score = 98;
      else if (lang.startsWith('zh-cn-')) score = 95;
      else if (lang.startsWith('zh-hans')) score = 85;
      else if (lang === 'cmn-cn' || lang.startsWith('cmn-hans')) score = 80;
      if (/xiaoxiao|xiaoyi/i.test(name)) score += 40;
      else if (/yunxi|yunyang|huihui|yaoyao|kangkang/i.test(name)) score += 30;
      else if (preferredMainlandNames.test(name)) score += 20;
      if (voice.default) score += 2;
      return { voice, score };
    })
    .filter(({ score }) => score >= 80)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.voice ?? null;
}

async function getLoadedVoices(timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const current = synth.getVoices();
  if (current.length > 0) return current;

  return await new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener('voiceschanged', finish);
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', finish, { once: true });
    window.setTimeout(finish, timeoutMs);
  });
}

export async function speakChinese(text: string): Promise<ChineseSpeechResult> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    return { ok: false, reason: 'unsupported' };
  }

  const voices = await getLoadedVoices();
  const chineseVoice = selectMandarinVoice(voices);
  if (!chineseVoice) return { ok: false, reason: 'voice-unavailable' };

  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = chineseVoice;
  utterance.lang = 'zh-CN';
  utterance.rate = text.length <= 1 ? 0.82 : 0.88;
  utterance.pitch = 1;
  utterance.volume = 1;
  return await new Promise((resolve) => {
    let settled = false;
    const finish = (result: ChineseSpeechResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(result);
    };
    const timeoutId = window.setTimeout(() => finish({ ok: false, reason: 'playback-error' }), 1800);
    utterance.onstart = () => finish({ ok: true, voiceName: chineseVoice.name });
    utterance.onerror = () => finish({ ok: false, reason: 'playback-error' });
    synth.resume();
    synth.speak(utterance);
  });
}
