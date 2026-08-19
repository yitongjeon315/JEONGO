import { isSameOriginRequest, jsonError } from '@/lib/server/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);
  try {
    const incoming = await request.formData();
    const audio = incoming.get('audio');
    const prompt = typeof incoming.get('prompt') === 'string' ? String(incoming.get('prompt')).slice(0, 500) : '';
    if (!(audio instanceof File) || audio.size === 0) return jsonError('음성 파일이 필요합니다.', 400);
    if (audio.size > MAX_AUDIO_BYTES) return jsonError('음성 파일은 10MB 이하여야 합니다.', 413);
    const pronunciationUrl = process.env.PRONUNCIATION_ANALYSIS_URL;
    if (pronunciationUrl) {
      const providerForm = new FormData();
      providerForm.set('audio', audio, audio.name || 'speech.webm');
      providerForm.set('targetHanzi', prompt);
      const providerResponse = await fetch(pronunciationUrl, {
        method: 'POST',
        headers: process.env.PRONUNCIATION_ANALYSIS_KEY ? { authorization: `Bearer ${process.env.PRONUNCIATION_ANALYSIS_KEY}` } : undefined,
        body: providerForm,
        signal: AbortSignal.timeout(30_000),
      });
      if (!providerResponse.ok) throw new Error(`PRONUNCIATION_PROVIDER_${providerResponse.status}`);
      const analysis = (await providerResponse.json()) as Record<string, unknown>;
      const transcript = typeof analysis.transcript === 'string' ? analysis.transcript.trim().slice(0, 1000) : '';
      const pronunciationScore = Number(analysis.pronunciationScore);
      const fluencyScore = Number(analysis.fluencyScore);
      if (!transcript || !Number.isFinite(pronunciationScore) || !Number.isFinite(fluencyScore)) throw new Error('PRONUNCIATION_PROVIDER_INVALID');
      return Response.json({ transcript, pronunciationScore: Math.max(0, Math.min(100, pronunciationScore)), fluencyScore: Math.max(0, Math.min(100, fluencyScore)), words: Array.isArray(analysis.words) ? analysis.words : [], userPitchCurve: Array.isArray(analysis.userPitchCurve) ? analysis.userPitchCurve : [], nativePitchCurve: Array.isArray(analysis.nativePitchCurve) ? analysis.nativePitchCurve : [], confidence: Number(analysis.confidence), source: 'pronunciation-provider' });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return jsonError('서버 음성 전사 설정이 필요합니다.', 503);
    const form = new FormData();
    form.set('file', audio, audio.name || 'speech.webm');
    form.set('model', process.env.OPENAI_TRANSCRIBE_MODEL ?? 'gpt-transcribe');
    form.set('language', 'zh');
    if (prompt) form.set('prompt', prompt);
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`OPENAI_TRANSCRIBE_${response.status}`);
    const result = (await response.json()) as { text?: string };
    const transcript = result.text?.trim().slice(0, 1000);
    if (!transcript) throw new Error('OPENAI_TRANSCRIBE_EMPTY');
    return Response.json({ transcript, source: 'server' });
  } catch (error) {
    console.error('Audio transcription failed', error);
    return jsonError('서버 음성 전사를 완료하지 못했습니다.', 502);
  }
}
