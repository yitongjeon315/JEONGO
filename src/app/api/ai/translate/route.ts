import { enforceAiAccess } from '@/lib/server/ai-access';
import { isSameOriginRequest, jsonError } from '@/lib/server/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OpenAIResponse { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);
  const accessError = await enforceAiAccess('translate');
  if (accessError) return accessError;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonError('AI 번역 API 설정이 필요합니다.', 503);
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const hanzi = typeof body.hanzi === 'string' ? body.hanzi.trim().slice(0, 64) : '';
    const pinyin = typeof body.pinyin === 'string' ? body.pinyin.trim().slice(0, 128) : '';
    const sourceMeaning = typeof body.sourceMeaning === 'string' ? body.sourceMeaning.trim().slice(0, 500) : '';
    const language = body.language === 'en' ? 'English' : body.language === 'ko' ? 'Korean' : '';
    if (!hanzi || !sourceMeaning || !language) return jsonError('번역할 단어 정보가 올바르지 않습니다.', 400);
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-5.6-luna',
        instructions: `중국어 학습 사전 편집자입니다. 주어진 중국어 단어의 뜻만 자연스러운 ${language}로 번역하세요. 설명, 따옴표, 병음은 출력하지 마세요.`,
        input: `단어: ${hanzi}\n병음: ${pinyin}\n현재 뜻: ${sourceMeaning}`,
        max_output_tokens: 100,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`OPENAI_${response.status}`);
    const payload = (await response.json()) as OpenAIResponse;
    const translation = (payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text ?? '').trim().slice(0, 500);
    if (!translation) throw new Error('OPENAI_EMPTY');
    return Response.json({ translation });
  } catch (error) {
    console.error('Vocabulary translation failed', error);
    return jsonError('번역을 완료하지 못했습니다.', 502);
  }
}
